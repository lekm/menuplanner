-- COMPREHENSIVE ONBOARDING DEBUG & AUDIT SCRIPT
-- Run this in your Supabase SQL Editor to diagnose ALL onboarding issues

-- 1. CHECK CURRENT STATE OF ALL USERS
SELECT 
    id, 
    email, 
    display_name, 
    onboarding_completed, 
    onboarding_date, 
    created_at,
    updated_at,
    CASE 
        WHEN onboarding_completed = true AND onboarding_date IS NULL THEN 'INCONSISTENT: completed but no date'
        WHEN onboarding_completed = false AND onboarding_date IS NOT NULL THEN 'INCONSISTENT: not completed but has date'
        WHEN onboarding_completed = true AND onboarding_date IS NOT NULL THEN 'CONSISTENT: completed with date'
        ELSE 'CONSISTENT: not completed'
    END as state_analysis
FROM public.user_profiles 
ORDER BY created_at DESC;

-- 2. CHECK TABLE SCHEMA FOR ISSUES
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('onboarding_completed', 'onboarding_date', 'age_range')
ORDER BY ordinal_position;

-- 3. CHECK FOR DUPLICATE COLUMNS (schema bug)
SELECT 
    column_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
GROUP BY column_name
HAVING COUNT(*) > 1;

-- 4. CHECK TRIGGERS THAT MIGHT RESET VALUES
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles'
ORDER BY trigger_name;

-- 5. CHECK RLS POLICIES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 6. CHECK IF USERS CAN UPDATE THEIR PROFILES (test with actual user)
-- Replace with actual user ID
SELECT 
    id,
    email,
    'Can read own profile' as test_type,
    CASE 
        WHEN id IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM public.user_profiles 
WHERE email = 'slothrop.ai@gmail.com';

-- 7. CHECK FOR ORPHANED AUTH USERS (users without profiles)
SELECT 
    auth.users.id,
    auth.users.email,
    auth.users.created_at as auth_created,
    public.user_profiles.id as profile_id,
    public.user_profiles.created_at as profile_created
FROM auth.users 
LEFT JOIN public.user_profiles ON auth.users.id = public.user_profiles.id
WHERE public.user_profiles.id IS NULL;

-- 8. CHECK PROFILE CREATION FUNCTION
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 9. TEST UPSERT OPERATION (use your actual user ID)
-- This tests if the upsert would work
EXPLAIN (ANALYZE, BUFFERS) 
INSERT INTO public.user_profiles (
    id, 
    email, 
    onboarding_completed, 
    onboarding_date, 
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'slothrop.ai@gmail.com'),
    'slothrop.ai@gmail.com',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET 
    onboarding_completed = EXCLUDED.onboarding_completed,
    onboarding_date = EXCLUDED.onboarding_date,
    updated_at = EXCLUDED.updated_at;

-- 10. MANUAL FIX FOR IMMEDIATE TESTING
-- Run this to temporarily fix the issue for testing
UPDATE public.user_profiles 
SET 
    onboarding_completed = true, 
    onboarding_date = NOW(),
    updated_at = NOW()
WHERE email = 'slothrop.ai@gmail.com';

-- 11. VERIFY THE FIX
SELECT 
    id, 
    email, 
    display_name, 
    onboarding_completed, 
    onboarding_date, 
    updated_at,
    'MANUAL FIX APPLIED' as status
FROM public.user_profiles 
WHERE email = 'slothrop.ai@gmail.com';

-- 12. CHECK FOR RECENT FAILED OPERATIONS
-- Look for patterns in update times
SELECT 
    email,
    onboarding_completed,
    created_at,
    updated_at,
    updated_at - created_at as time_to_complete,
    CASE 
        WHEN updated_at > created_at + INTERVAL '1 hour' THEN 'DELAYED_COMPLETION'
        WHEN updated_at = created_at THEN 'NEVER_UPDATED'
        ELSE 'NORMAL'
    END as completion_pattern
FROM public.user_profiles 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;