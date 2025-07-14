-- Migration SQL to add missing columns to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add missing onboarding and conversational fields
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
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_version TEXT DEFAULT '5.0';

-- Remove duplicate age_range column if it exists (SETUP.md has it twice)
-- This will fail silently if the column doesn't exist, which is fine
DO $$ 
BEGIN
    -- Check if we have duplicate age_range columns and clean up if needed
    IF (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'age_range' 
        AND table_schema = 'public') > 1 THEN
        -- Drop and recreate to avoid conflicts
        ALTER TABLE public.user_profiles DROP COLUMN age_range;
        ALTER TABLE public.user_profiles ADD COLUMN age_range TEXT;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors, just ensure we have the column
    NULL;
END $$;