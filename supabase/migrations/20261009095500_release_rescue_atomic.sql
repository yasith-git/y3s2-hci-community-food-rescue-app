-- ==========================================================
-- SUPABASE MIGRATION: VOLUNTEER RELEASE RESCUE ATOMIC RPC
-- Safely releases a pre-pickup rescue assignment back to PUBLISHED
-- Allows the donation to return to Volunteer Discover and be accepted by other volunteers
-- Timestamp: 20261009095500
-- ==========================================================

CREATE OR REPLACE FUNCTION public.release_rescue_atomic(
  p_donation_id UUID DEFAULT NULL,
  p_assignment_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_target_donation_id UUID := p_donation_id;
  v_donation public.donations%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 1. Verify Authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated: User must be signed in.';
  END IF;

  -- 2. Resolve donation ID if only assignment ID was provided
  IF v_target_donation_id IS NULL AND p_assignment_id IS NOT NULL THEN
    SELECT donation_id INTO v_target_donation_id
    FROM public.rescue_assignments
    WHERE id = p_assignment_id;
  END IF;

  IF v_target_donation_id IS NULL THEN
    RAISE EXCEPTION 'invalid-argument: Must provide a valid donation_id or assignment_id.';
  END IF;

  -- 3. Lock Donation Row & Verify Existence
  SELECT * INTO v_donation
  FROM public.donations
  WHERE id = v_target_donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not-found: Donation not found.';
  END IF;

  -- 4. Idempotency Check: Already released and available
  IF v_donation.status = 'PUBLISHED' AND v_donation.assigned_volunteer_id IS NULL THEN
    -- Ensure any lingering assignment for this volunteer is marked CANCELLED
    UPDATE public.rescue_assignments SET
      status = 'CANCELLED',
      updated_at = v_now
    WHERE (donation_id = v_target_donation_id AND volunteer_id = v_user_id AND status != 'CANCELLED')
       OR (p_assignment_id IS NOT NULL AND id = p_assignment_id AND volunteer_id = v_user_id);

    RETURN jsonb_build_object(
      'success', true,
      'status', 'PUBLISHED',
      'alreadyReleased', true,
      'message', 'Rescue mission was already released.'
    );
  END IF;

  -- 5. Authorization Check: Current user must be the assigned volunteer
  IF (v_donation.assigned_volunteer_id IS NOT NULL AND v_donation.assigned_volunteer_id != v_user_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.rescue_assignments
       WHERE donation_id = v_target_donation_id
         AND volunteer_id = v_user_id
         AND status != 'CANCELLED'
     ) THEN
    RAISE EXCEPTION 'permission-denied: Only the assigned volunteer can release this rescue.';
  END IF;

  -- 6. Anti-Abandonment / Post-Pickup Protection
  -- Once physical custody has been taken (PICKED_UP or later), release is strictly prohibited
  IF v_donation.status IN ('PICKED_UP', 'DELIVERY_EN_ROUTE', 'DELIVERED', 'COMPLETED', 'ACKNOWLEDGED') THEN
    RAISE EXCEPTION 'failed-precondition: Food has already been collected. Please use the Report Issue flow instead of releasing.';
  END IF;

  IF v_donation.status NOT IN ('VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE') THEN
    RAISE EXCEPTION 'failed-precondition: Donation cannot be released from status: %', v_donation.status;
  END IF;

  -- 7. Atomically Update Donation back to PUBLISHED
  UPDATE public.donations SET
    status = 'PUBLISHED',
    assigned_volunteer_id = NULL,
    assigned_volunteer_name = NULL,
    updated_at = v_now
  WHERE id = v_target_donation_id;

  -- 8. Atomically Update Related Rescue Assignment to CANCELLED
  IF p_assignment_id IS NOT NULL THEN
    UPDATE public.rescue_assignments SET
      status = 'CANCELLED',
      updated_at = v_now
    WHERE id = p_assignment_id AND volunteer_id = v_user_id;
  END IF;

  UPDATE public.rescue_assignments SET
    status = 'CANCELLED',
    updated_at = v_now
  WHERE donation_id = v_target_donation_id
    AND volunteer_id = v_user_id
    AND status != 'CANCELLED';

  RETURN jsonb_build_object(
    'success', true,
    'donationId', v_target_donation_id,
    'status', 'PUBLISHED',
    'releasedAt', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_rescue_atomic(UUID, UUID, TEXT) TO authenticated;
