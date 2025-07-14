-- Debug meal_plans table to check if it exists and is properly configured
-- Run this in your Supabase SQL Editor

-- Check if meal_plans table exists
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meal_plans' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies on meal_plans
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'meal_plans';

-- Check if there are any meal_plans records
SELECT COUNT(*) as total_meal_plans FROM public.meal_plans;

-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  week_start DATE NOT NULL,
  meals JSONB NOT NULL DEFAULT '{}',
  shared_with UUID[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT FALSE,
  template_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start, is_template, template_name)
);

-- Enable RLS if not already enabled
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Users can view own meal plans" ON public.meal_plans;
    DROP POLICY IF EXISTS "Users can insert own meal plans" ON public.meal_plans;
    DROP POLICY IF EXISTS "Users can update own meal plans" ON public.meal_plans;
    DROP POLICY IF EXISTS "Users can delete own meal plans" ON public.meal_plans;
    
    -- Create new policies
    CREATE POLICY "Users can view own meal plans" ON public.meal_plans
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

    CREATE POLICY "Users can insert own meal plans" ON public.meal_plans
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own meal plans" ON public.meal_plans
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own meal plans" ON public.meal_plans
      FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start ON public.meal_plans(week_start);