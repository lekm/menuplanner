# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose your organization
5. Set project details:
   - **Name**: `menuplanner`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to you
6. Click "Create new project"

## 2. Get Your Project Credentials

After project creation, go to **Settings > API**:
- Copy your **Project URL** 
- Copy your **anon/public key**

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Run Database Schema

In your Supabase dashboard, go to **SQL Editor** and run this schema (copy everything from the line starting with "-- Enable Row Level Security" to the end of the trigger creation):

**IMPORTANT**: Copy and paste the SQL commands below WITHOUT the ```sql markers!

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Legacy structured fields (for backwards compatibility)
  age_range TEXT,
  household_size TEXT,
  cooking_experience TEXT,
  cooking_equipment TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  equipment_level TEXT,
  work_schedule TEXT,
  energy_preference TEXT,
  meal_prep_style TEXT,
  spice_collection TEXT[] DEFAULT '{}',
  energy_preferences JSONB DEFAULT '{}',
  
  -- New conversational onboarding fields
  onboarding_type TEXT DEFAULT 'structured', -- 'structured' or 'conversational'
  cooking_background TEXT, -- Free-form response about cooking experience
  dietary_needs TEXT, -- Free-form response about dietary needs
  kitchen_equipment TEXT, -- Free-form response about equipment
  schedule_energy TEXT, -- Free-form response about schedule/energy
  goals_challenges TEXT, -- Free-form response about goals
  skills_comfort TEXT, -- Free-form response about skills
  flavor_preferences TEXT, -- Free-form response about flavors
  planning_style TEXT, -- Free-form response about planning
  full_conversation JSONB DEFAULT '{}', -- Complete conversation history
  
  -- Meta fields
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_date TIMESTAMPTZ,
  profile_version TEXT DEFAULT '4.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes table
CREATE TABLE public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT,
  cooking_time INTEGER, -- minutes
  energy_level TEXT CHECK (energy_level IN ('high', 'medium', 'low')),
  equipment TEXT[] DEFAULT '{}',
  cuisine_type TEXT,
  icon TEXT DEFAULT '🍽️',
  is_public BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Plans table
CREATE TABLE public.meal_plans (
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

-- Recipe Collections table (for organizing recipes)
CREATE TABLE public.recipe_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  recipe_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Ratings table (for future community features)
CREATE TABLE public.recipe_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for recipes
CREATE POLICY "Users can view own recipes" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can view own meal plans" ON public.meal_plans
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

CREATE POLICY "Users can insert own meal plans" ON public.meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON public.meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON public.meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recipe_collections
CREATE POLICY "Users can view own collections" ON public.recipe_collections
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own collections" ON public.recipe_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.recipe_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.recipe_collections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recipe_ratings
CREATE POLICY "Users can view all ratings" ON public.recipe_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own ratings" ON public.recipe_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.recipe_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.recipe_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipes_energy_level ON public.recipes(energy_level);
CREATE INDEX idx_recipes_is_public ON public.recipes(is_public);
CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX idx_meal_plans_week_start ON public.meal_plans(week_start);
CREATE INDEX idx_recipe_ratings_recipe_id ON public.recipe_ratings(recipe_id);

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update recipe ratings
CREATE OR REPLACE FUNCTION update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.recipes
  SET 
    rating_avg = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    )
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update recipe ratings
CREATE TRIGGER on_recipe_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON public.recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION update_recipe_rating();

## 5. Enable Authentication Providers

In your Supabase dashboard:

1. Go to **Authentication > Providers**
2. Enable **Email** (already enabled)
3. Enable **Google**:
   - You'll need to set up Google OAuth (we'll do this later)
4. Enable **GitHub**:
   - You'll need to set up GitHub OAuth (we'll do this later)

## 6. EmailJS Setup

1. Go to [https://www.emailjs.com](https://www.emailjs.com)
2. Sign up for free account
3. Create a new email service
4. Create an email template for bug reports
5. Get your:
   - **User ID**
   - **Service ID** 
   - **Template ID**

Add to your `.env.local`:
```bash
VITE_EMAILJS_USER_ID=your_user_id
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

Let me know when you've completed these steps and I'll continue with the implementation!