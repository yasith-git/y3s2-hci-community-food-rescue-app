-- ============================================================================
-- Profile Details & Avatar Photos (Donor / Volunteer self-service profile edit)
-- Community Food Rescue App
--
-- Purely additive migration:
--   1. Adds nullable profiles.date_of_birth column
--   2. Adds SECURITY DEFINER RPC `update_my_profile_details` which lets the
--      signed-in user update ONLY their own name / phone / DOB / avatar.
--      (role, verification_status, organization fields are never touched,
--      so this cannot be used for privilege escalation.)
--   3. Creates a public-read `avatars` storage bucket where each user may
--      only write inside their own `<auth.uid()>/` folder.
-- ============================================================================

-- 1. Date of birth column ----------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_date_of_birth_range_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_date_of_birth_range_check
      CHECK (date_of_birth IS NULL OR date_of_birth >= DATE '1900-01-01');
  END IF;
END $$;

-- 2. Self-service profile details RPC ----------------------------------------
CREATE OR REPLACE FUNCTION public.update_my_profile_details(
  p_full_name TEXT,
  p_phone_number TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_name TEXT := btrim(COALESCE(p_full_name, ''));
  v_phone TEXT := NULLIF(btrim(COALESCE(p_phone_number, '')), '');
  v_avatar TEXT := NULLIF(btrim(COALESCE(p_avatar_url, '')), '');
  v_row public.profiles%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF char_length(v_name) < 2 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 80 characters' USING ERRCODE = '22023';
  END IF;

  IF v_phone IS NOT NULL AND v_phone !~ '^\+?[0-9 ()-]{7,20}$' THEN
    RAISE EXCEPTION 'Invalid mobile number' USING ERRCODE = '22023';
  END IF;

  IF p_date_of_birth IS NOT NULL AND (p_date_of_birth > CURRENT_DATE OR p_date_of_birth < DATE '1900-01-01') THEN
    RAISE EXCEPTION 'Invalid date of birth' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
     SET full_name     = v_name,
         phone_number  = v_phone,
         date_of_birth = p_date_of_birth,
         avatar_url    = v_avatar,
         updated_at    = NOW()
   WHERE id = v_user_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile_details(TEXT, TEXT, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile_details(TEXT, TEXT, DATE, TEXT) TO authenticated;

-- 3. Avatars storage bucket ---------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
