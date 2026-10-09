-- ==========================================================
-- SUPABASE MIGRATION: ENFORCE SINGLE ACTIVE RESCUE IN ACCEPT ATOMIC RPC
-- Enforces: One volunteer = Maximum one unfinished active rescue
-- Serializes concurrent volunteer requests and protects data consistency
-- Timestamp: 20261009102000
-- ==========================================================

-- 1. Reconcile any existing duplicate active test assignments for university test accounts:
-- Keep the latest active assignment and mark older ones as CANCELLED.
WITH ranked_active AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY volunteer_id
           ORDER BY accepted_at DESC, created_at DESC
         ) AS rn
  FROM public.rescue_assignments
  WHERE status NOT IN ('COMPLETED', 'CANCELLED')
)
UPDATE public.rescue_assignments
SET status = 'CANCELLED',
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM ranked_active WHERE rn > 1
);

-- 2. Update accept_rescue_atomic to strictly enforce single active rescue rule
CREATE OR REPLACE FUNCTION public.accept_rescue_atomic(
  p_donation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_profile public.profiles%ROWTYPE;
  v_donation public.donations%ROWTYPE;
  v_assignment_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_active_count INT;
BEGIN
  -- 1. Verify Authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated: User must be signed in.';
  END IF;

  -- 2. Lock Volunteer Profile to serialize concurrent acceptance requests from same volunteer
  SELECT * INTO v_user_profile
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  -- 3. ENFORCE SINGLE ACTIVE RESCUE RULE
  -- Check for any unfinished active assignment for this volunteer
  -- Active statuses: ASSIGNED, PICKUP_EN_ROUTE, PICKED_UP, DELIVERY_EN_ROUTE, DELIVERED
  -- Terminal statuses: COMPLETED, CANCELLED
  SELECT COUNT(*) INTO v_active_count
  FROM public.rescue_assignments
  WHERE volunteer_id = v_user_id
    AND status NOT IN ('COMPLETED', 'CANCELLED');

  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'failed-precondition: You already have an active rescue. Complete or release it before accepting another.';
  END IF;

  -- Also check donations table for any active in-transit assignment
  IF EXISTS (
    SELECT 1 FROM public.donations
    WHERE assigned_volunteer_id = v_user_id
      AND status IN ('VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE', 'PICKED_UP', 'DELIVERY_EN_ROUTE', 'DELIVERED')
  ) THEN
    RAISE EXCEPTION 'failed-precondition: You already have an active rescue. Complete or release it before accepting another.';
  END IF;

  -- 4. Lock Donation Row & Verify Availability
  SELECT * INTO v_donation
  FROM public.donations
  WHERE id = p_donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not-found: Donation not found.';
  END IF;

  IF v_donation.status NOT IN ('PUBLISHED', 'RESERVED') THEN
    RAISE EXCEPTION 'failed-precondition: This rescue has already been accepted by another volunteer.';
  END IF;

  -- 5. Atomically Update Donation to VOLUNTEER_ASSIGNED
  UPDATE public.donations SET
    status = 'VOLUNTEER_ASSIGNED',
    assigned_volunteer_id = v_user_id,
    assigned_volunteer_name = COALESCE(v_user_profile.full_name, 'Volunteer'),
    accepted_at = v_now,
    updated_at = v_now
  WHERE id = p_donation_id;

  -- 6. Atomically Create New Assignment Record
  INSERT INTO public.rescue_assignments (
    donation_id,
    volunteer_id,
    volunteer_name,
    donor_id,
    food_name,
    quantity,
    unit,
    pickup_address,
    image_url,
    community_point_id,
    community_point_name,
    community_point_address,
    status,
    accepted_at,
    created_at,
    updated_at
  ) VALUES (
    v_donation.id,
    v_user_id,
    COALESCE(v_user_profile.full_name, 'Volunteer'),
    v_donation.donor_id,
    v_donation.food_name,
    v_donation.quantity,
    v_donation.unit,
    v_donation.pickup_address,
    v_donation.image_url,
    v_donation.community_point_id,
    v_donation.community_point_name,
    v_donation.community_point_address,
    'ASSIGNED',
    v_now,
    v_now,
    v_now
  )
  RETURNING id INTO v_assignment_id;

  -- 7. Notify Donor Asynchronously via In-App Notification
  IF v_donation.donor_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, type, title, body, resource_type, resource_id, deep_link_route, priority
    ) VALUES (
      v_donation.donor_id,
      'RESCUE_ACCEPTED',
      'Volunteer Accepted 🎉',
      'A volunteer accepted your food donation.',
      'donation',
      v_donation.id::text,
      '/(donor)/tracking?donationId=' || v_donation.id::text,
      'NORMAL'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_assignment_id,
    'donationId', v_donation.id,
    'status', 'ASSIGNED',
    'acceptedAt', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_rescue_atomic(UUID) TO authenticated;
