-- Migration: 002_rls_policies
-- Row Level Security for the profiles table

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read any profile
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- Only the owning user can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only the owning user can delete their own profile
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Insert is handled by the trigger only — block direct inserts
CREATE POLICY "profiles_insert_via_trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
