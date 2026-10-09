-- ====================================================================
-- RESCUEAI 1.0 MIGRATION: EXPLAINABLE INTELLIGENT FOOD RESCUE ENGINE
-- Engine Version: rescue-ai-v1
-- Migration: 20261007075000_rescue_ai_insights.sql
-- 
-- INTEGRATION MIGRATION ORDER DEPENDENCY:
-- 1. 20260930000000_initial_schema.sql (auth, profiles, donations)
-- 2. 20261007070000_coordinator_trust_and_distribution.sql (organizations, organization_members, community_points) [feature/coordinator-trust]
-- 3. 20261007073000_smart_routing_and_routes.sql (volunteer_routes) [feature/smart-routing]
-- 4. 20261007075000_rescue_ai_insights.sql (rescue_ai_insights, rescue_ai_matches) [feature/leader-smart-donation]
-- ====================================================================

-- 1. Create rescue_ai_insights Table
CREATE TABLE IF NOT EXISTS public.rescue_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
    urgency_score NUMERIC(5, 2) CHECK (urgency_score IS NULL OR (urgency_score >= 0.00 AND urgency_score <= 100.00)),
    urgency_level TEXT NOT NULL CHECK (urgency_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    summary TEXT,
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(reasons) = 'array'),
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(warnings) = 'array'),
    attention JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attention) = 'array'),
    input_hash TEXT NOT NULL,
    engine_version TEXT NOT NULL DEFAULT 'rescue-ai-v1',
    provider_name TEXT,
    model_name TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create rescue_ai_matches Table with Mutual Exclusivity and JSON Array Integrity
CREATE TABLE IF NOT EXISTS public.rescue_ai_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
    match_type TEXT NOT NULL CHECK (match_type IN ('ORGANIZATION', 'VOLUNTEER_ROUTE')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    volunteer_route_id UUID REFERENCES public.volunteer_routes(id) ON DELETE CASCADE,
    deterministic_score NUMERIC(5, 2) CHECK (deterministic_score IS NULL OR (deterministic_score >= 0.00 AND deterministic_score <= 100.00)),
    label TEXT NOT NULL,
    summary TEXT,
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(reasons) = 'array'),
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(warnings) = 'array'),
    attention JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attention) = 'array'),
    input_hash TEXT NOT NULL,
    engine_version TEXT NOT NULL DEFAULT 'rescue-ai-v1',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- MATCH-TYPE INTEGRITY CONSTRAINT:
    -- An ORGANIZATION match must specify organization_id and leave volunteer_route_id null.
    -- A VOLUNTEER_ROUTE match must specify volunteer_route_id and leave organization_id null.
    CONSTRAINT chk_rescue_ai_matches_target CHECK (
        (match_type = 'ORGANIZATION' AND organization_id IS NOT NULL AND volunteer_route_id IS NULL)
        OR
        (match_type = 'VOLUNTEER_ROUTE' AND volunteer_route_id IS NOT NULL AND organization_id IS NULL)
    )
);

-- 3. Indexes for fast lookup and join acceleration
CREATE INDEX IF NOT EXISTS idx_rescue_ai_insights_donation_id ON public.rescue_ai_insights(donation_id);
CREATE INDEX IF NOT EXISTS idx_rescue_ai_insights_input_hash ON public.rescue_ai_insights(input_hash);
CREATE INDEX IF NOT EXISTS idx_rescue_ai_matches_donation_id ON public.rescue_ai_matches(donation_id);
CREATE INDEX IF NOT EXISTS idx_rescue_ai_matches_org_id ON public.rescue_ai_matches(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rescue_ai_matches_route_id ON public.rescue_ai_matches(volunteer_route_id) WHERE volunteer_route_id IS NOT NULL;

-- 4. Enable Row Level Security
-- Architecture: Normal mobile clients have SELECT-only permissions where authorized.
-- Writes (INSERT/UPDATE/DELETE) are performed exclusively server-side by authenticated Edge Functions.
-- Service-role credentials remain strictly server-side (service_role inherently bypasses RLS).
ALTER TABLE public.rescue_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_ai_matches ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: rescue_ai_insights (Read-only for mobile clients)
-- Read policy: Donors view insights for their own listings; Authorized responders view insights for active listings
CREATE POLICY "Authorized users view relevant insights"
    ON public.rescue_ai_insights FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.donations d
            WHERE d.id = rescue_ai_insights.donation_id
            AND (
                d.donor_id = auth.uid()
                OR d.status IN ('PUBLISHED', 'RESERVED', 'VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE', 'PICKED_UP', 'DELIVERY_EN_ROUTE')
            )
        )
    );

-- 6. RLS Policies: rescue_ai_matches (Read-only for mobile clients)
-- Read policy: Verified coordinators view their org matches; Route owners view their route matches; Donors view matches on their donations
CREATE POLICY "Authorized users view relevant AI matches"
    ON public.rescue_ai_matches FOR SELECT
    TO authenticated
    USING (
        -- Volunteer sees matches for their own active routes
        (volunteer_route_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.volunteer_routes vr
            WHERE vr.id = rescue_ai_matches.volunteer_route_id
            AND vr.volunteer_id = auth.uid()
        ))
        OR
        -- Verified coordinator sees matches for their organization
        (organization_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = rescue_ai_matches.organization_id
            AND om.user_id = auth.uid()
        ))
        OR
        -- Donor sees matches generated for their listing
        EXISTS (
            SELECT 1 FROM public.donations d
            WHERE d.id = rescue_ai_matches.donation_id
            AND d.donor_id = auth.uid()
        )
    );
