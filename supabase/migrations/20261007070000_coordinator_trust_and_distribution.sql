-- ==========================================================
-- SUPABASE MIGRATION: PHASE COORDINATOR 2.0
-- VERIFIED ORGANIZATIONS, SMART ALLOCATION, & BENEFICIARY DISTRIBUTION TRACEABILITY
-- Timestamp: 20261007070000
-- ==========================================================

-- 1. Create Organization Verification Status Enum if needed (or reuse verification_status)
DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM (
    'FOOD_BANK',
    'CHARITY',
    'COMMUNITY_PANTRY',
    'SHELTER',
    'RELIGIOUS_WELFARE',
    'COMMUNITY_KITCHEN',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  registration_number TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city_area TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_radius_km NUMERIC DEFAULT 15.0 CHECK (service_radius_km >= 0),
  description TEXT,
  distribution_capacity_people INTEGER DEFAULT 50 CHECK (distribution_capacity_people > 0),
  storage_capabilities TEXT[] DEFAULT ARRAY['AMBIENT']::TEXT[],
  accepted_food_categories TEXT[] DEFAULT ARRAY['All']::TEXT[],
  verification_status verification_status DEFAULT 'PENDING' NOT NULL,
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Organization Members Table (Links Coordinators to Organizations)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role TEXT DEFAULT 'COORDINATOR_PRIMARY' NOT NULL,
  is_primary_contact BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (organization_id, user_id)
);

-- 4. Add organization_id reference to profiles & community_points
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.community_points
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 5. Beneficiary Distribution Records Table
CREATE TABLE IF NOT EXISTS public.distribution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  community_point_id UUID REFERENCES public.community_points(id) ON DELETE SET NULL,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  distribution_reference TEXT NOT NULL,
  distribution_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  recipient_group TEXT NOT NULL,
  people_served INTEGER NOT NULL CHECK (people_served > 0),
  quantity_distributed NUMERIC NOT NULL CHECK (quantity_distributed > 0),
  unit TEXT NOT NULL,
  distribution_location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Indexes for Performance and Organization Scoping
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(verification_status, is_active);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_distribution_donation ON public.distribution_records(donation_id);
CREATE INDEX IF NOT EXISTS idx_distribution_org ON public.distribution_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_community_points_org ON public.community_points(organization_id);

-- ==========================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_records ENABLE ROW LEVEL SECURITY;

-- 7.1 Organizations RLS
-- Anyone authenticated can view active verified organizations
CREATE POLICY "Public read verified active organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (verification_status = 'VERIFIED' AND is_active = true);

-- Organization members can view their own organization regardless of status (including PENDING)
CREATE POLICY "Members view own organization"
ON public.organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

-- Deny direct client UPDATE of verification_status (enforced: no update policy on verification fields)
CREATE POLICY "Primary members update basic org details"
ON public.organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND is_primary_contact = true
  )
)
WITH CHECK (
  -- Prevent client self-verification
  verification_status = (SELECT verification_status FROM public.organizations WHERE id = public.organizations.id)
  AND verified_at IS NOT DISTINCT FROM (SELECT verified_at FROM public.organizations WHERE id = public.organizations.id)
  AND verified_by IS NOT DISTINCT FROM (SELECT verified_by FROM public.organizations WHERE id = public.organizations.id)
);

-- 7.2 Organization Members RLS
CREATE POLICY "Members view organization membership"
ON public.organization_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

-- 7.3 Distribution Records RLS
CREATE POLICY "Organization members view their distribution records"
ON public.distribution_records FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
  OR donation_id IN (
    -- Donor can see anonymized distribution summary of their own donation
    SELECT id FROM public.donations WHERE donor_id = auth.uid()
  )
);

-- ==========================================================
-- 8. ATOMIC RPCS FOR COORDINATOR 2.0
-- ==========================================================

-- 8.1 Coordinator Organization Application RPC
CREATE OR REPLACE FUNCTION public.apply_coordinator_organization_atomic(
  p_name TEXT,
  p_organization_type TEXT,
  p_registration_number TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_address TEXT,
  p_city_area TEXT,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_service_radius_km NUMERIC DEFAULT 15.0,
  p_description TEXT DEFAULT NULL,
  p_distribution_capacity_people INTEGER DEFAULT 50,
  p_storage_capabilities TEXT[] DEFAULT ARRAY['AMBIENT']::TEXT[],
  p_accepted_food_categories TEXT[] DEFAULT ARRAY['All']::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_existing_org_id UUID;
  v_org_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated: User must be signed in.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF v_profile.role != 'COORDINATOR' THEN
    RAISE EXCEPTION 'permission-denied: Only community coordinator accounts can submit organization applications.';
  END IF;

  -- Check if already a member of an active/pending organization
  SELECT organization_id INTO v_existing_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_existing_org_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'organizationId', v_existing_org_id,
      'status', 'PENDING',
      'message', 'Application already exists and is pending verification.'
    );
  END IF;

  -- Insert Organization in PENDING verification status
  INSERT INTO public.organizations (
    name,
    organization_type,
    registration_number,
    contact_email,
    contact_phone,
    address,
    city_area,
    latitude,
    longitude,
    service_radius_km,
    description,
    distribution_capacity_people,
    storage_capabilities,
    accepted_food_categories,
    verification_status,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    TRIM(p_name),
    TRIM(p_organization_type),
    NULLIF(TRIM(p_registration_number), ''),
    LOWER(TRIM(p_contact_email)),
    TRIM(p_contact_phone),
    TRIM(p_address),
    TRIM(p_city_area),
    p_latitude,
    p_longitude,
    COALESCE(p_service_radius_km, 15.0),
    p_description,
    GREATEST(COALESCE(p_distribution_capacity_people, 50), 1),
    COALESCE(p_storage_capabilities, ARRAY['AMBIENT']::TEXT[]),
    COALESCE(p_accepted_food_categories, ARRAY['All']::TEXT[]),
    'PENDING'::verification_status,
    true,
    v_now,
    v_now
  )
  RETURNING id INTO v_org_id;

  -- Insert Organization Primary Membership
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    member_role,
    is_primary_contact,
    created_at
  ) VALUES (
    v_org_id,
    v_user_id,
    'COORDINATOR_PRIMARY',
    true,
    v_now
  );

  -- Link organization to profile with PENDING status
  UPDATE public.profiles SET
    organization_id = v_org_id,
    organization_name = TRIM(p_name),
    verification_status = 'PENDING'::verification_status,
    updated_at = v_now
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'organizationId', v_org_id,
    'status', 'PENDING',
    'message', 'Organization application submitted for review.'
  );
END;
$$;

-- 8.2 Hardened reserve_donation_atomic with Organization Verification Check
CREATE OR REPLACE FUNCTION public.reserve_donation_atomic(
  p_donation_id UUID,
  p_community_point_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_profile public.profiles%ROWTYPE;
  v_org public.organizations%ROWTYPE;
  v_point public.community_points%ROWTYPE;
  v_donation public.donations%ROWTYPE;
  v_reservation_id UUID := gen_random_uuid();
  v_delivery_code TEXT := (1000 + floor(random() * 9000))::text;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated: User must be signed in.';
  END IF;

  SELECT * INTO v_user_profile FROM public.profiles WHERE id = v_user_id;
  IF v_user_profile.role != 'COORDINATOR' THEN
    RAISE EXCEPTION 'permission-denied: Only community coordinators can reserve donations.';
  END IF;

  -- 1. Check Verified Organization Membership
  IF v_user_profile.organization_id IS NULL THEN
    RAISE EXCEPTION 'permission-denied: Coordinator must belong to an organization.';
  END IF;

  SELECT * INTO v_org FROM public.organizations WHERE id = v_user_profile.organization_id;
  IF NOT FOUND OR NOT v_org.is_active THEN
    RAISE EXCEPTION 'permission-denied: Organization is inactive or not found.';
  END IF;

  IF v_org.verification_status != 'VERIFIED' THEN
    RAISE EXCEPTION 'permission-denied: Only verified community organizations can reserve surplus food donations.';
  END IF;

  -- 2. Validate Community Point Authorization
  SELECT * INTO v_point FROM public.community_points WHERE id = p_community_point_id;
  IF NOT FOUND OR NOT v_point.is_active THEN
    RAISE EXCEPTION 'permission-denied: Invalid or inactive collection point.';
  END IF;

  IF v_point.organization_id IS NOT NULL AND v_point.organization_id != v_org.id THEN
    RAISE EXCEPTION 'permission-denied: Community point belongs to another organization.';
  ELSIF v_point.organization_id IS NULL AND v_point.coordinator_id != v_user_id THEN
    RAISE EXCEPTION 'permission-denied: Unauthorized community point.';
  END IF;

  -- 3. Lock Donation Row & Concurrency Check
  SELECT * INTO v_donation FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not-found: Donation not found.';
  END IF;

  IF v_donation.status != 'PUBLISHED' THEN
    RAISE EXCEPTION 'aborted: Donation was just reserved by another community organization.';
  END IF;

  IF v_donation.pickup_deadline_at <= v_now THEN
    RAISE EXCEPTION 'failed-precondition: Donation pickup window has expired.';
  END IF;

  -- 4. Insert Reservation
  INSERT INTO public.reservations (
    id, donation_id, donor_id, coordinator_id, coordinator_name,
    coordinator_organization, community_point_id, community_point_name,
    community_point_address, status, delivery_code, reserved_at
  ) VALUES (
    v_reservation_id, v_donation.id, v_donation.donor_id, v_user_id,
    v_user_profile.full_name, v_org.name,
    v_point.id, v_point.label, v_point.address, 'ACTIVE', v_delivery_code, v_now
  );

  -- 5. Transition Donation State
  UPDATE public.donations SET
    status = 'RESERVED',
    reserved_by = v_user_id,
    reserved_by_name = v_user_profile.full_name,
    community_point_id = v_point.id,
    community_point_name = v_point.label,
    community_point_address = v_point.address,
    delivery_code = v_delivery_code,
    reserved_at = v_now,
    updated_at = v_now
  WHERE id = p_donation_id;

  -- 6. Donor Notification
  INSERT INTO public.notifications (
    user_id, type, title, body, resource_type, resource_id, deep_link_route, priority
  ) VALUES (
    v_donation.donor_id,
    'DONATION_RESERVED',
    'Donation Reserved! 📦',
    v_org.name || ' reserved "' || v_donation.food_name || '" for community distribution.',
    'donation',
    v_donation.id::text,
    '/(donor)/track/' || v_donation.id::text,
    'HIGH'
  );

  RETURN jsonb_build_object('success', true, 'reservationId', v_reservation_id, 'status', 'RESERVED');
END;
$$;

-- 8.3 Atomic Delivery Acknowledgment RPC (DELIVERED -> ACKNOWLEDGED)
CREATE OR REPLACE FUNCTION public.acknowledge_delivery_atomic(
  p_donation_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_actual_quantity_received NUMERIC DEFAULT NULL
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
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated: User must be signed in.';
  END IF;

  SELECT * INTO v_user_profile FROM public.profiles WHERE id = v_user_id;
  IF v_user_profile.role != 'COORDINATOR' THEN
    RAISE EXCEPTION 'permission-denied: Only coordinators can acknowledge delivery.';
  END IF;

  SELECT * INTO v_donation FROM public.donations WHERE id = p_donation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not-found: Donation not found.';
  END IF;

  IF v_donation.reserved_by != v_user_id THEN
    RAISE EXCEPTION 'permission-denied: Only the reserving coordinator can acknowledge receipt.';
  END IF;

  IF v_donation.status != 'DELIVERED' THEN
    RAISE EXCEPTION 'failed-precondition: Donation must be delivered by volunteer before receipt can be acknowledged (Current: %)', v_donation.status;
  END IF;

  -- Update status to ACKNOWLEDGED
  UPDATE public.donations SET
    status = 'ACKNOWLEDGED',
    acknowledged_at = v_now,
    updated_at = v_now
  WHERE id = p_donation_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'ACKNOWLEDGED',
    'message', 'Delivery receipt acknowledged. Ready for distribution recording.'
  );
END;
$$;

-- 8.4 Atomic Beneficiary Distribution Recording RPC (ACKNOWLEDGED -> COMPLETED)
CREATE OR REPLACE FUNCTION public.record_distribution_atomic(
  p_donation_id UUID,
  p_recipient_group TEXT,
  p_people_served INTEGER,
  p_quantity_distributed NUMERIC,
  p_unit TEXT,
  p_distribution_location TEXT,
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
  v_org public.organizations%ROWTYPE;
  v_donation public.donations%ROWTYPE;
  v_total_previously_distributed NUMERIC := 0;
  v_new_total NUMERIC := 0;
  v_dist_ref TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_is_fully_distributed BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated: User must be signed in.';
  END IF;

  SELECT * INTO v_user_profile FROM public.profiles WHERE id = v_user_id;
  IF v_user_profile.role != 'COORDINATOR' THEN
    RAISE EXCEPTION 'permission-denied: Only community coordinators can record food distribution.';
  END IF;

  IF v_user_profile.organization_id IS NULL THEN
    RAISE EXCEPTION 'permission-denied: Coordinator does not belong to an organization.';
  END IF;

  -- Lock donation row
  SELECT * INTO v_donation FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not-found: Donation not found.';
  END IF;

  IF v_donation.reserved_by != v_user_id THEN
    RAISE EXCEPTION 'permission-denied: You can only record distribution for donations reserved by your organization.';
  END IF;

  IF v_donation.status != 'ACKNOWLEDGED' AND v_donation.status != 'COMPLETED' THEN
    RAISE EXCEPTION 'failed-precondition: Donation must be acknowledged before recording distribution (Current: %)', v_donation.status;
  END IF;

  -- Validate inputs
  IF p_people_served <= 0 THEN
    RAISE EXCEPTION 'invalid-argument: Number of people served must be greater than zero.';
  END IF;

  IF p_quantity_distributed <= 0 THEN
    RAISE EXCEPTION 'invalid-argument: Quantity distributed must be greater than zero.';
  END IF;

  -- Check unit compatibility
  IF LOWER(TRIM(v_donation.unit)) != LOWER(TRIM(p_unit)) THEN
    RAISE EXCEPTION 'invalid-argument: Distribution unit (%) does not match donation received unit (%).', p_unit, v_donation.unit;
  END IF;

  -- Sum previous distributions for this donation
  SELECT COALESCE(SUM(quantity_distributed), 0)
  INTO v_total_previously_distributed
  FROM public.distribution_records
  WHERE donation_id = p_donation_id;

  v_new_total := v_total_previously_distributed + p_quantity_distributed;

  IF v_new_total > v_donation.quantity THEN
    RAISE EXCEPTION 'invalid-argument: Total distributed quantity (%) exceeds received donation quantity (%).', v_new_total, v_donation.quantity;
  END IF;

  -- Generate readable distribution reference: DIST-YYYY-XXXX
  v_dist_ref := 'DIST-' || TO_CHAR(v_now, 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Insert Distribution Record
  INSERT INTO public.distribution_records (
    donation_id,
    organization_id,
    community_point_id,
    recorded_by,
    distribution_reference,
    distribution_date,
    recipient_group,
    people_served,
    quantity_distributed,
    unit,
    distribution_location,
    notes,
    created_at,
    updated_at
  ) VALUES (
    v_donation.id,
    v_user_profile.organization_id,
    v_donation.community_point_id,
    v_user_id,
    v_dist_ref,
    v_now,
    TRIM(p_recipient_group),
    p_people_served,
    p_quantity_distributed,
    TRIM(p_unit),
    TRIM(p_distribution_location),
    p_notes,
    v_now,
    v_now
  );

  -- Check if all received food has now been accounted for
  IF v_new_total >= v_donation.quantity THEN
    v_is_fully_distributed := true;

    UPDATE public.donations SET
      status = 'COMPLETED',
      completed_at = v_now,
      updated_at = v_now
    WHERE id = p_donation_id;

    UPDATE public.reservations SET
      status = 'COMPLETED',
      completed_at = v_now,
      updated_at = v_now
    WHERE donation_id = p_donation_id AND coordinator_id = v_user_id;

    -- Create completion notification for Donor
    INSERT INTO public.notifications (
      user_id, type, title, body, resource_type, resource_id, deep_link_route, priority
    ) VALUES (
      v_donation.donor_id,
      'DONATION_COMPLETED',
      'Food Rescue Completed! 🎉',
      'Your donation of ' || v_donation.food_name || ' was successfully distributed to ' || p_recipient_group || ' (' || p_people_served::text || ' people served).',
      'donation',
      v_donation.id::text,
      '/(donor)/impact',
      'HIGH'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'distributionReference', v_dist_ref,
    'isCompleted', v_is_fully_distributed,
    'totalDistributed', v_new_total,
    'remainingQuantity', GREATEST(v_donation.quantity - v_new_total, 0),
    'status', CASE WHEN v_is_fully_distributed THEN 'COMPLETED' ELSE 'ACKNOWLEDGED' END
  );
END;
$$;
