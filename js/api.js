// API Abstraction Layer for Meal Planner
// This layer abstracts data storage and will grow from localStorage → Supabase → AI services

class MealPlannerAPI {
    constructor() {
        this.isSupabaseEnabled = false;
        this.supabase = null;
        this.currentUser = null;
        this.initializeSupabase();
    }

    async initializeSupabase() {
        // Check if Supabase is configured
        const supabaseUrl = window.VITE_SUPABASE_URL;
        const supabaseKey = window.VITE_SUPABASE_ANON_KEY;
        
        console.log('🔍 Supabase init debug:');
        console.log('  URL:', supabaseUrl);
        console.log('  Key present:', !!supabaseKey);
        console.log('  window.supabase available:', !!window.supabase);
        
        if (supabaseUrl && supabaseKey && window.supabase) {
            try {
                // Use globally loaded Supabase
                console.log('🚀 Creating Supabase client...');
                this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                this.isSupabaseEnabled = true;
                
                // Listen for auth changes
                this.supabase.auth.onAuthStateChange((event, session) => {
                    console.log('🔐 Auth state change:', event, session?.user?.email);
                    this.currentUser = session?.user || null;
                    this.onAuthStateChange(event, session);
                });
                
                // Check current session
                const { data: { session } } = await this.supabase.auth.getSession();
                this.currentUser = session?.user || null;
                
                console.log('✅ Supabase initialized successfully');
                console.log('👤 Current user:', this.currentUser?.email || 'None');
            } catch (error) {
                console.error('❌ Supabase initialization failed:', error);
                this.isSupabaseEnabled = false;
            }
        } else {
            console.log('⚠️ Supabase not configured, using localStorage');
            if (!supabaseUrl) console.log('  Missing URL');
            if (!supabaseKey) console.log('  Missing key');
            if (!window.supabase) console.log('  Supabase library not loaded');
        }
    }

    onAuthStateChange(event, session) {
        // Override this in your main app to handle auth state changes
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('authStateChange', {
            detail: { event, session, user: session?.user }
        }));
    }

    // ===== Authentication Methods =====
    
    async signUp(email, password, userData = {}) {
        if (!this.isSupabaseEnabled) {
            throw new Error('Authentication requires Supabase configuration');
        }
        
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        
        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        if (!this.isSupabaseEnabled) {
            throw new Error('Authentication requires Supabase configuration');
        }
        
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    }

    async signInWithProvider(provider) {
        if (!this.isSupabaseEnabled) {
            throw new Error('Authentication requires Supabase configuration');
        }
        
        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        return data;
    }

    async signOut() {
        if (!this.isSupabaseEnabled) {
            return;
        }
        
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    async resetPassword(email) {
        if (!this.isSupabaseEnabled) {
            throw new Error('Authentication requires Supabase configuration');
        }
        
        const { error } = await this.supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    }

    // ===== User Profile Methods =====
    
    async getUserProfile() {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            return null;
        }
        
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .single();
            
        if (error && error.code !== 'PGRST116') { // Not found is ok
            throw error;
        }
        
        return data;
    }

    async updateUserProfile(profileData) {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            throw new Error('User must be authenticated');
        }
        
        const { data, error } = await this.supabase
            .from('user_profiles')
            .upsert({
                id: this.currentUser.id,
                ...profileData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    // ===== Recipe Methods =====
    
    async getRecipes() {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('recipes')) || [];
        }
        
        const { data, error } = await this.supabase
            .from('recipes')
            .select('*')
            .eq('user_id', this.currentUser.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data || [];
    }

    async saveRecipe(recipe) {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
            const newRecipe = { ...recipe, id: Date.now() };
            recipes.push(newRecipe);
            localStorage.setItem('recipes', JSON.stringify(recipes));
            return newRecipe;
        }
        
        const { data, error } = await this.supabase
            .from('recipes')
            .insert({
                ...recipe,
                user_id: this.currentUser.id
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async updateRecipe(id, updates) {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
            const index = recipes.findIndex(r => r.id === id);
            if (index !== -1) {
                recipes[index] = { ...recipes[index], ...updates };
                localStorage.setItem('recipes', JSON.stringify(recipes));
                return recipes[index];
            }
            throw new Error('Recipe not found');
        }
        
        const { data, error } = await this.supabase
            .from('recipes')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', this.currentUser.id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async deleteRecipe(id) {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
            const filtered = recipes.filter(r => r.id !== id);
            localStorage.setItem('recipes', JSON.stringify(filtered));
            return;
        }
        
        const { error } = await this.supabase
            .from('recipes')
            .delete()
            .eq('id', id)
            .eq('user_id', this.currentUser.id);
            
        if (error) throw error;
    }

    // ===== Meal Plan Methods =====
    
    async getMealPlan(weekStart = null) {
        if (!weekStart) {
            // Get current week
            const now = new Date();
            const dayOfWeek = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            weekStart = monday.toISOString().split('T')[0];
        }
        
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('mealPlan')) || {};
        }
        
        const { data, error } = await this.supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', this.currentUser.id)
            .eq('week_start', weekStart)
            .eq('is_template', false)
            .maybeSingle();
            
        if (error) {
            console.error('Error fetching meal plan:', error);
            throw error;
        }
        
        return data?.meals || {};
    }

    async saveMealPlan(meals, weekStart = null) {
        if (!weekStart) {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            weekStart = monday.toISOString().split('T')[0];
        }
        
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            localStorage.setItem('mealPlan', JSON.stringify(meals));
            return;
        }
        
        const { data, error } = await this.supabase
            .from('meal_plans')
            .upsert({
                user_id: this.currentUser.id,
                week_start: weekStart,
                meals: meals,
                is_template: false,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    // ===== Template Methods =====
    
    async getTemplates() {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('savedTemplates')) || [];
        }
        
        const { data, error } = await this.supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', this.currentUser.id)
            .eq('is_template', true)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data || [];
    }

    async saveTemplate(name, meals) {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            const templates = JSON.parse(localStorage.getItem('savedTemplates')) || [];
            const template = {
                id: Date.now(),
                name,
                meals,
                created: Date.now()
            };
            templates.push(template);
            localStorage.setItem('savedTemplates', JSON.stringify(templates));
            return template;
        }
        
        const { data, error } = await this.supabase
            .from('meal_plans')
            .insert({
                user_id: this.currentUser.id,
                template_name: name,
                meals: meals,
                is_template: true,
                week_start: '1970-01-01' // Dummy date for templates
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async deleteTemplate(id) {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            // Fallback to localStorage
            const templates = JSON.parse(localStorage.getItem('savedTemplates')) || [];
            const filtered = templates.filter(t => t.id !== id);
            localStorage.setItem('savedTemplates', JSON.stringify(filtered));
            return;
        }
        
        const { error } = await this.supabase
            .from('meal_plans')
            .delete()
            .eq('id', id)
            .eq('user_id', this.currentUser.id)
            .eq('is_template', true);
            
        if (error) throw error;
    }

    // ===== Migration Methods =====
    
    async migrateLocalStorageToSupabase() {
        if (!this.isSupabaseEnabled || !this.currentUser) {
            return;
        }
        
        try {
            // Migrate recipes
            const localRecipes = JSON.parse(localStorage.getItem('recipes')) || [];
            for (const recipe of localRecipes) {
                const { id, ...recipeData } = recipe;
                await this.saveRecipe(recipeData);
            }
            
            // Migrate meal plan
            const localMealPlan = JSON.parse(localStorage.getItem('mealPlan'));
            if (localMealPlan) {
                await this.saveMealPlan(localMealPlan);
            }
            
            // Migrate templates
            const localTemplates = JSON.parse(localStorage.getItem('savedTemplates')) || [];
            for (const template of localTemplates) {
                await this.saveTemplate(template.name, template.meals);
            }
            
            console.log('Migration completed successfully');
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }

    // ===== Utility Methods =====
    
    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isSupabaseReady() {
        return this.isSupabaseEnabled;
    }
}

// Create global instance
window.mealPlannerAPI = new MealPlannerAPI();