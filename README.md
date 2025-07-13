# Weekly Meal Planner

A comprehensive meal planning app designed for busy professionals with energy-based meal suggestions, recipe management, and template system.

## Features

### 🗓️ **Smart Meal Planning**
- **Energy-Level Planning**: Choose from High Energy, Medium Energy, or Survival Mode
- **Personalized Schedule**: Built-in awareness of work-from-home days and bar shifts
- **Smart Meal Suggestions**: Click-to-add meal ideas based on your energy level
- **Visual Recipe Picker**: Click the 📖 button on any meal slot to choose from your recipes
- **ROYGBIV Color Scheme**: Beautiful rainbow-colored weekly calendar

### 📖 **Recipe Management System**
- **Personal Recipe Collection**: Store recipes with ingredients, instructions, and cooking time
- **Visual Recipe Cards**: Each recipe has an emoji icon and detailed information
- **Energy-Level Categorization**: Organize recipes by complexity and energy required
- **Equipment Tracking**: Tag recipes by cooking equipment (Instant Pot, Cast Iron, etc.)
- **Searchable Database**: Find recipes by name or ingredient
- **Quick Recipe Use**: Add any stored recipe to your meal plan with one click

### 📋 **Meal Templates**
- **Built-in Templates**: 
  - "High Energy Week" - Complex, rewarding meals for motivated cooking
  - "Survival Mode Week" - Anti-takeaway options for low-energy days
- **Save Custom Templates**: Turn any weekly plan into a reusable template
- **Template Library**: Manage and reuse your favorite weekly meal combinations
- **One-Click Loading**: Apply any template to instantly fill your weekly planner

### 🛒 **Smart Grocery Lists**
- **Auto-Generated Lists**: Create shopping lists from your planned meals
- **Categorized Shopping**: Organized by Proteins, Produce, Pantry, and Frozen
- **Print-Friendly**: Generate printable lists for shopping
- **Pantry Reminders**: Built-in reminders to check your spice collection first

### 📱 **Mobile-Optimized Experience**
- **Responsive Design**: Optimized for both desktop and mobile use
- **Touch-Friendly Interface**: Large buttons and easy navigation on phones
- **Flexible Text Sizing**: Adapts to different screen sizes
- **Mobile Gestures**: Smooth interactions on touch devices

### 🔐 **User Authentication & Cloud Sync**
- **Multiple Login Options**: Email/password, Google OAuth, or GitHub OAuth
- **Cloud Storage**: Save your recipes and meal plans to your personal account
- **Data Migration**: Seamlessly migrate existing local data to your cloud account
- **Multi-Device Access**: Access your meal plans from any device
- **Privacy-First**: Your data is private and only accessible to you

### 🐛 **Built-in Bug Reporting**
- **One-Click Bug Reports**: Report issues directly from the app
- **Feature Requests**: Suggest new features through the built-in form
- **System Information**: Automatically captures browser and system details
- **Developer Feedback**: Direct communication channel for improvements

## Meal Suggestions Include

### High Energy 🚀
- Complex recipes using Instant Pot, sous vide, pizza oven
- Spice-heavy dishes leveraging your 48-spice collection
- Batch cooking options like lamb ragu for freezing
- Weekend project meals with elaborate sides

### Medium Energy ⚡
- One-pot meals and cast iron cooking
- Quick stir-fries and simple curries
- Upgraded comfort foods with minimal prep
- 30-minute satisfying meals

### Survival Mode 😴
- Anti-takeaway options to avoid Uber Eats
- Quick assembly meals using quality ingredients
- Nutribullet smoothies and upgraded sandwiches
- Dinner Ladies backup meals

## Usage

### Basic Planning
1. Select your current energy level using the energy buttons
2. Browse suggested meals and click to add to your planner
3. Use the 📖 button on any meal slot to pick from your saved recipes
4. Fill in your weekly meal plan
5. Generate grocery lists for shopping
6. Save your plans for later

### Recipe Management
1. Go to the "My Recipes" tab
2. Click "Add Recipe" to create new recipes with ingredients and instructions
3. Choose energy levels and required equipment for each recipe
4. Use the search function to find specific recipes
5. Click "Use" on any recipe to add it to your current meal plan

### Template System
1. Create a meal plan you love
2. Click "Save Template" to store it for reuse
3. Visit the "Templates" tab to browse built-in and saved templates
4. Load any template with one click to instantly fill your planner
5. Customize loaded templates as needed

## Technical Details

- **Scalable Architecture**: Designed to grow from simple local storage to full cloud integration
- **Optional Cloud Backend**: Uses Supabase for authentication and data storage when configured
- **Graceful Degradation**: Works offline with localStorage when cloud services are unavailable
- **Zero Configuration Deployment**: Works on Vercel, Netlify, or any static host
- **Progressive Web App Ready**: Can be installed on mobile devices
- **Privacy-First Design**: Row Level Security ensures your data remains private

### Tech Stack
- **Frontend**: HTML, CSS (Tailwind), Vanilla JavaScript
- **Authentication**: Supabase Auth with OAuth support
- **Database**: PostgreSQL with Row Level Security (when using Supabase)
- **Bug Reporting**: EmailJS for direct developer communication
- **Deployment**: Static hosting compatible (Vercel, Netlify, GitHub Pages)

### Setup Requirements
- **Basic Use**: No setup required - works immediately with localStorage
- **Cloud Features**: Requires Supabase project setup (see SETUP.md)
- **Bug Reporting**: Requires EmailJS configuration (see SETUP.md)