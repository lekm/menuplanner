-- COMPREHENSIVE SCHEMA FIX SCRIPT
-- This addresses all database schema issues causing onboarding failures
-- Run each section in your Supabase SQL Editor

-- ===============================================================
-- 1. FIX DUPLICATE COLUMNS AND SCHEMA INCONSISTENCIES
-- ===============================================================

-- Check for and fix duplicate age_range columns
DO $$ 
BEGIN
    -- Check if we have duplicate age_range columns and clean up if needed
    IF (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'age_range' 
        AND table_schema = 'public') > 1 THEN
        
        -- Drop all age_range columns and recreate cleanly
        ALTER TABLE public.user_profiles DROP COLUMN age_range;
        ALTER TABLE public.user_profiles ADD COLUMN age_range TEXT;
        
        RAISE NOTICE 'Fixed duplicate age_range columns';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors, just ensure we have the column
    RAISE NOTICE 'age_range column handling completed';
END $$;

-- ===============================================================
-- 2. ENSURE ALL REQUIRED COLUMNS EXIST WITH PROPER CONSTRAINTS
-- ===============================================================

-- Add missing columns if they don't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_type TEXT DEFAULT 'structured',
ADD COLUMN IF NOT EXISTS living_situation TEXT,
ADD COLUMN IF NOT EXISTS accessibility_needs TEXT,
ADD COLUMN IF NOT EXISTS cooking_background TEXT,
ADD COLUMN IF NOT EXISTS dietary_needs TEXT,
ADD COLUMN IF NOT EXISTS kitchen_equipment TEXT,
ADD COLUMN IF NOT EXISTS schedule_energy TEXT,
ADD COLUMN IF NOT EXISTS goals_challenges TEXT,
ADD COLUMN IF NOT EXISTS skills_comfort TEXT,
ADD COLUMN IF NOT EXISTS flavor_preferences TEXT,
ADD COLUMN IF NOT EXISTS planning_style TEXT,
ADD COLUMN IF NOT EXISTS breakfast_preferences TEXT,
ADD COLUMN IF NOT EXISTS full_conversation JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_version TEXT DEFAULT '5.0';

-- Ensure critical onboarding columns exist with proper constraints
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_date TIMESTAMPTZ;

-- ===============================================================
-- 3. ADD CONSTRAINTS TO PREVENT DATA INTEGRITY ISSUES
-- ===============================================================

-- Add check constraint to ensure onboarding_completed consistency
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS onboarding_date_consistency;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT onboarding_date_consistency 
CHECK (
    (onboarding_completed = false AND onboarding_date IS NULL) OR
    (onboarding_completed = true AND onboarding_date IS NOT NULL)
);

-- Add index for faster onboarding queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON public.user_profiles (onboarding_completed, onboarding_date);

-- ===============================================================
-- 4. FIX EXISTING INCONSISTENT DATA
-- ===============================================================

-- Fix users who have onboarding_completed = true but no onboarding_date
UPDATE public.user_profiles 
SET onboarding_date = COALESCE(onboarding_date, updated_at, created_at)
WHERE onboarding_completed = true 
AND onboarding_date IS NULL;

-- Fix users who have onboarding_date but onboarding_completed = false
-- (This might be users who were in the middle of onboarding)
UPDATE public.user_profiles 
SET onboarding_completed = true
WHERE onboarding_date IS NOT NULL 
AND onboarding_completed = false
AND full_conversation IS NOT NULL 
AND full_conversation != '{}';

-- ===============================================================
-- 5. IMPROVE RLS POLICIES FOR ONBOARDING
-- ===============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ===============================================================
-- 6. IMPROVE PROFILE CREATION TRIGGER
-- ===============================================================

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    display_name,
    onboarding_completed,
    onboarding_date,
    created_at,
    updated_at
  ) VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    FALSE,
    NULL,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail auth
  RAISE LOG 'Failed to create user profile for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===============================================================
-- 7. ADD ONBOARDING STATE RECOVERY FUNCTION
-- ===============================================================

-- Function to detect and fix incomplete onboarding states
CREATE OR REPLACE FUNCTION public.recover_incomplete_onboarding()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  issue_type TEXT,
  action_taken TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH fixes AS (
    -- Fix users with inconsistent onboarding state
    UPDATE public.user_profiles 
    SET 
      onboarding_completed = CASE 
        WHEN full_conversation IS NOT NULL 
             AND full_conversation != '{}' 
             AND jsonb_array_length(full_conversation->'responses') > 5 
        THEN true 
        ELSE false 
      END,
      onboarding_date = CASE 
        WHEN full_conversation IS NOT NULL 
             AND full_conversation != '{}' 
             AND jsonb_array_length(full_conversation->'responses') > 5 
             AND onboarding_date IS NULL
        THEN updated_at
        ELSE onboarding_date
      END,
      updated_at = NOW()
    WHERE (
      (onboarding_completed = true AND onboarding_date IS NULL) OR
      (onboarding_completed = false AND onboarding_date IS NOT NULL) OR
      (onboarding_completed = false AND full_conversation IS NOT NULL AND full_conversation != '{}')
    )
    RETURNING 
      id,
      email,
      CASE 
        WHEN onboarding_completed = true AND onboarding_date IS NULL THEN 'missing_date'
        WHEN onboarding_completed = false AND onboarding_date IS NOT NULL THEN 'inconsistent_completion'
        ELSE 'recovered_from_conversation'
      END as issue_type,
      'fixed' as action_taken
  )
  SELECT * FROM fixes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- 8. VERIFICATION QUERIES
-- ===============================================================

-- Check schema is now consistent
SELECT 
  'Schema Check' as test_type,
  COUNT(*) as column_count,
  'age_range columns' as details
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'age_range';

-- Check constraints are in place
SELECT 
  'Constraint Check' as test_type,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles' 
AND constraint_name = 'onboarding_date_consistency';

-- Check RLS policies are active
SELECT 
  'RLS Policy Check' as test_type,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Summary of user states after fixes
SELECT 
  'User State Summary' as test_type,
  onboarding_completed,
  COUNT(*) as user_count,
  COUNT(CASE WHEN onboarding_date IS NULL THEN 1 END) as missing_date_count
FROM public.user_profiles 
GROUP BY onboarding_completed;