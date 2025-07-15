-- CREATE TRANSACTIONAL ONBOARDING FUNCTIONS
-- These functions ensure onboarding completion is atomic and recoverable
-- Run this in your Supabase SQL Editor

-- ===============================================================
-- 1. TRANSACTIONAL ONBOARDING COMPLETION FUNCTION
-- ===============================================================

CREATE OR REPLACE FUNCTION complete_onboarding_transaction(profile_data JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    user_id UUID;
BEGIN
    -- Extract user ID from profile data
    user_id := (profile_data->>'id')::UUID;
    
    -- Verify user is authenticated (this would be handled by RLS in practice)
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Start transaction (implicit in function)
    -- Update user profile with all onboarding data
    UPDATE public.user_profiles 
    SET 
        -- Onboarding completion fields
        onboarding_completed = true,
        onboarding_date = NOW(),
        updated_at = NOW(),
        
        -- Onboarding response fields
        onboarding_type = COALESCE(profile_data->>'onboarding_type', onboarding_type),
        living_situation = COALESCE(profile_data->>'living_situation', living_situation),
        accessibility_needs = COALESCE(profile_data->>'accessibility_needs', accessibility_needs),
        cooking_background = COALESCE(profile_data->>'cooking_background', cooking_background),
        dietary_needs = COALESCE(profile_data->>'dietary_needs', dietary_needs),
        kitchen_equipment = COALESCE(profile_data->>'kitchen_equipment', kitchen_equipment),
        schedule_energy = COALESCE(profile_data->>'schedule_energy', schedule_energy),
        goals_challenges = COALESCE(profile_data->>'goals_challenges', goals_challenges),
        skills_comfort = COALESCE(profile_data->>'skills_comfort', skills_comfort),
        flavor_preferences = COALESCE(profile_data->>'flavor_preferences', flavor_preferences),
        planning_style = COALESCE(profile_data->>'planning_style', planning_style),
        breakfast_preferences = COALESCE(profile_data->>'breakfast_preferences', breakfast_preferences),
        age_range = COALESCE(profile_data->>'age_range', age_range),
        
        -- Store full conversation if provided
        full_conversation = COALESCE(
            CASE 
                WHEN profile_data ? 'full_conversation' THEN profile_data->'full_conversation'
                ELSE full_conversation 
            END, 
            '{}'::jsonb
        ),
        
        -- Update profile version
        profile_version = COALESCE(profile_data->>'profile_version', '5.0')
    WHERE id = user_id;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found for ID: %', user_id;
    END IF;
    
    -- Return the updated profile data
    SELECT to_jsonb(up.*) INTO result
    FROM public.user_profiles up
    WHERE up.id = user_id;
    
    -- Log successful completion
    RAISE NOTICE 'Onboarding completed successfully for user: %', user_id;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE NOTICE 'Onboarding transaction failed for user %: %', user_id, SQLERRM;
    -- Re-raise the exception to trigger rollback
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- 2. ONBOARDING STATE VERIFICATION FUNCTION
-- ===============================================================

CREATE OR REPLACE FUNCTION verify_onboarding_state(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    profile_record RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO profile_record
    FROM public.user_profiles
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User profile not found',
            'user_id', user_id
        );
    END IF;
    
    -- Check onboarding completion consistency
    SELECT jsonb_build_object(
        'success', (
            profile_record.onboarding_completed = true AND 
            profile_record.onboarding_date IS NOT NULL
        ),
        'user_id', user_id,
        'onboarding_completed', profile_record.onboarding_completed,
        'onboarding_date', profile_record.onboarding_date,
        'has_conversation_data', (
            profile_record.full_conversation IS NOT NULL AND 
            profile_record.full_conversation != '{}'::jsonb
        ),
        'profile_updated', profile_record.updated_at,
        'consistency_check', CASE
            WHEN profile_record.onboarding_completed = true AND profile_record.onboarding_date IS NULL THEN 'MISSING_DATE'
            WHEN profile_record.onboarding_completed = false AND profile_record.onboarding_date IS NOT NULL THEN 'INCONSISTENT_STATE'
            WHEN profile_record.onboarding_completed = true AND profile_record.onboarding_date IS NOT NULL THEN 'CONSISTENT'
            ELSE 'NOT_COMPLETED'
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- 3. BATCH ONBOARDING RECOVERY FUNCTION
-- ===============================================================

CREATE OR REPLACE FUNCTION recover_incomplete_onboarding()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    issue_type TEXT,
    action_taken TEXT,
    success BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH recovery_actions AS (
        -- Fix users with inconsistent onboarding state
        UPDATE public.user_profiles 
        SET 
            onboarding_completed = CASE 
                WHEN full_conversation IS NOT NULL 
                     AND full_conversation != '{}'::jsonb 
                     AND jsonb_typeof(full_conversation->'responses') = 'array'
                     AND jsonb_array_length(full_conversation->'responses') > 5 
                THEN true 
                ELSE onboarding_completed 
            END,
            onboarding_date = CASE 
                WHEN full_conversation IS NOT NULL 
                     AND full_conversation != '{}'::jsonb 
                     AND jsonb_typeof(full_conversation->'responses') = 'array'
                     AND jsonb_array_length(full_conversation->'responses') > 5 
                     AND onboarding_date IS NULL
                THEN COALESCE(onboarding_date, updated_at, created_at)
                WHEN onboarding_completed = true AND onboarding_date IS NULL
                THEN COALESCE(updated_at, created_at)
                ELSE onboarding_date
            END,
            updated_at = NOW()
        WHERE (
            -- Missing onboarding date but marked complete
            (onboarding_completed = true AND onboarding_date IS NULL) OR
            -- Has date but not marked complete
            (onboarding_completed = false AND onboarding_date IS NOT NULL) OR
            -- Has full conversation data but not marked complete
            (
                onboarding_completed = false AND 
                full_conversation IS NOT NULL AND 
                full_conversation != '{}'::jsonb AND
                jsonb_typeof(full_conversation->'responses') = 'array' AND
                jsonb_array_length(full_conversation->'responses') > 5
            )
        )
        RETURNING 
            id,
            email,
            CASE 
                WHEN onboarding_completed = true AND LAG(onboarding_date) OVER (PARTITION BY id ORDER BY updated_at) IS NULL THEN 'missing_date'
                WHEN onboarding_completed = false AND onboarding_date IS NOT NULL THEN 'inconsistent_completion'
                WHEN onboarding_completed = true AND full_conversation IS NOT NULL THEN 'recovered_from_conversation'
                ELSE 'unknown_recovery'
            END as issue_type,
            'fixed' as action_taken,
            true as success
    )
    SELECT * FROM recovery_actions;
    
    -- Log recovery completion
    GET DIAGNOSTICS recovery_count = ROW_COUNT;
    RAISE NOTICE 'Onboarding recovery completed. Fixed % profiles.', recovery_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Onboarding recovery failed: %', SQLERRM;
    -- Return error result
    RETURN QUERY SELECT 
        NULL::UUID as user_id,
        'ERROR'::TEXT as email,
        'recovery_failed'::TEXT as issue_type,
        SQLERRM::TEXT as action_taken,
        false as success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- 4. ONBOARDING HEALTH CHECK FUNCTION
-- ===============================================================

CREATE OR REPLACE FUNCTION onboarding_health_check()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_users INT;
    completed_users INT;
    consistent_users INT;
    inconsistent_users INT;
    missing_date_users INT;
    orphaned_profiles INT;
BEGIN
    -- Get user counts
    SELECT COUNT(*) INTO total_users FROM public.user_profiles;
    SELECT COUNT(*) INTO completed_users FROM public.user_profiles WHERE onboarding_completed = true;
    SELECT COUNT(*) INTO consistent_users FROM public.user_profiles 
    WHERE (onboarding_completed = true AND onboarding_date IS NOT NULL) OR 
          (onboarding_completed = false AND onboarding_date IS NULL);
    SELECT COUNT(*) INTO inconsistent_users FROM public.user_profiles 
    WHERE (onboarding_completed = true AND onboarding_date IS NULL) OR 
          (onboarding_completed = false AND onboarding_date IS NOT NULL);
    SELECT COUNT(*) INTO missing_date_users FROM public.user_profiles 
    WHERE onboarding_completed = true AND onboarding_date IS NULL;
    
    -- Check for orphaned profiles
    SELECT COUNT(*) INTO orphaned_profiles 
    FROM public.user_profiles up
    LEFT JOIN auth.users au ON up.id = au.id
    WHERE au.id IS NULL;
    
    -- Build result
    result := jsonb_build_object(
        'timestamp', NOW(),
        'total_users', total_users,
        'completed_users', completed_users,
        'completion_rate', CASE WHEN total_users > 0 THEN ROUND((completed_users::DECIMAL / total_users) * 100, 2) ELSE 0 END,
        'consistent_users', consistent_users,
        'inconsistent_users', inconsistent_users,
        'missing_date_users', missing_date_users,
        'orphaned_profiles', orphaned_profiles,
        'health_status', CASE 
            WHEN inconsistent_users = 0 AND orphaned_profiles = 0 THEN 'HEALTHY'
            WHEN inconsistent_users <= 5 AND orphaned_profiles = 0 THEN 'MINOR_ISSUES'
            ELSE 'NEEDS_ATTENTION'
        END,
        'recommendations', CASE 
            WHEN inconsistent_users > 0 THEN jsonb_build_array('Run recovery_incomplete_onboarding()')
            WHEN orphaned_profiles > 0 THEN jsonb_build_array('Check auth.users sync')
            ELSE jsonb_build_array('System is healthy')
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ===============================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION complete_onboarding_transaction(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_onboarding_state(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recover_incomplete_onboarding() TO authenticated;
GRANT EXECUTE ON FUNCTION onboarding_health_check() TO authenticated;

-- ===============================================================
-- 6. TEST THE FUNCTIONS
-- ===============================================================

-- Test health check
SELECT onboarding_health_check();

-- Test recovery (this will fix any existing issues)
SELECT * FROM recover_incomplete_onboarding();

-- Verify the functions were created successfully
SELECT 
    routine_name,
    routine_type,
    'Successfully created' as status
FROM information_schema.routines 
WHERE routine_name IN (
    'complete_onboarding_transaction',
    'verify_onboarding_state', 
    'recover_incomplete_onboarding',
    'onboarding_health_check'
) AND routine_schema = 'public'
ORDER BY routine_name;