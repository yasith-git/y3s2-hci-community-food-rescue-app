-- ==========================================================
-- SUPABASE MIGRATION: COMPLETE COLLECTION HANDOVER ATOMIC RPC
-- Performs atomic DELIVERED -> COMPLETED transition for Community Authority
-- Timestamp: 20261008122500
-- ==========================================================

CREATE OR REPLACE FUNCTION public.complete_collection_handover_atomic(
  p_donation_id UUID,
  p_actual_quantity NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
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
  v_assignment public.rescue_assignments%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_qty NUMERIC;
BEGIN
  -- 1. Verify Authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated: User must be signed in.';
  END IF;

  -- 2. Verify Community Authority Role
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = v_user_id;
  IF v_user_profile.role != 'COORDINATOR' THEN
    RAISE EXCEPTION 'permission-denied: Only community authorities/coordinators can confirm handover.';
  END IF;

  -- 3. Lock Donation Row & Verify State
  SELECT * INTO v_donation FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not-found: Donation not found.';
  END IF;

  -- Idempotent check
  IF v_donation.status = 'COMPLETED' THEN
    RETURN jsonb_build_object(
      'success', true,
      'status', 'COMPLETED',
      'alreadyCompleted', true,
      'message', 'Handover was already confirmed.'
    );
  END IF;

  IF v_donation.status != 'DELIVERED' AND v_donation.status != 'DELIVERY_EN_ROUTE' AND v_donation.status != 'PICKED_UP' THEN
    RAISE EXCEPTION 'failed-precondition: Donation must be delivered or in transit before confirming handover (Current status: %)', v_donation.status;
  END IF;

  -- 4. Determine and Validate Quantity
  v_qty := COALESCE(p_actual_quantity, v_donation.quantity);
  IF v_qty <= 0 THEN
    RAISE EXCEPTION 'invalid-argument: Received quantity must be greater than zero.';
  END IF;

  -- 5. Atomically Update Donation to COMPLETED
  UPDATE public.donations SET
    status = 'COMPLETED',
    acknowledged_at = v_now,
    completed_at = v_now,
    updated_at = v_now
  WHERE id = p_donation_id;

  -- 6. Atomically Update Related Reservations if any
  UPDATE public.reservations SET
    status = 'COMPLETED',
    completed_at = v_now,
    updated_at = v_now
  WHERE donation_id = p_donation_id;

  -- 7. Atomically Update Related Rescue Assignment to COMPLETED
  UPDATE public.rescue_assignments SET
    status = 'COMPLETED',
    completed_at = v_now,
    delivery_verified_at = COALESCE(delivery_verified_at, v_now),
    updated_at = v_now
  WHERE donation_id = p_donation_id;

  -- 8. Create In-App Notification for Donor
  IF v_donation.donor_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, type, title, body, resource_type, resource_id, deep_link_route, priority
    ) VALUES (
      v_donation.donor_id,
      'RESCUE_COMPLETED',
      'Food Rescue Complete 🎉',
      'Your food donation has been received by the Community Authority. Rescue completed.',
      'donation',
      v_donation.id::text,
      '/(donor)/tracking?id=' || v_donation.id::text,
      'HIGH'
    );
  END IF;

  -- 9. Create In-App Notification for Volunteer
  IF v_donation.assigned_volunteer_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, type, title, body, resource_type, resource_id, deep_link_route, priority
    ) VALUES (
      v_donation.assigned_volunteer_id,
      'RESCUE_COMPLETED',
      'Food Rescue Complete 🎉',
      'Community Authority confirmed the handover. Rescue completed.',
      'donation',
      v_donation.id::text,
      '/(volunteer)/activity',
      'HIGH'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'donationId', v_donation.id,
    'status', 'COMPLETED',
    'completedAt', v_now,
    'quantityReceived', v_qty
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_collection_handover_atomic(UUID, NUMERIC, TEXT) TO authenticated;
