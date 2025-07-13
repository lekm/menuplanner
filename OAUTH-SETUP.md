# OAuth Setup Guide - Google & GitHub

## 🔗 **Important: Get Your App URL First**

Before setting up OAuth, you need your live app URL. If you haven't deployed yet:

1. **Deploy to Vercel/Netlify** first
2. **Get your live URL** (e.g., `https://your-app.vercel.app`)
3. **Then continue with OAuth setup**

Your redirect URLs will use this live domain.

---

## 🔍 **Google OAuth Setup**

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. **Project Name**: `Meal Planner Auth`
4. Click **"Create"**
5. Make sure your new project is selected

### 2. Enable Google+ API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click **"Google+ API"** → **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have a Google Workspace)
3. Click **"Create"**

**Fill out the form:**
- **App name**: `Meal Planner`
- **User support email**: Your email
- **App domain**: Your deployed app domain (e.g., `your-app.vercel.app`)
- **Authorized domains**: Add your domain without `https://` (e.g., `your-app.vercel.app`)
- **Developer contact**: Your email

4. Click **"Save and Continue"**
5. **Scopes**: Click **"Save and Continue"** (default scopes are fine)
6. **Test users**: Add your email for testing
7. Click **"Save and Continue"**

### 4. Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. **Application type**: Web application
4. **Name**: `Meal Planner Web Client`

**Authorized JavaScript origins:**
```
https://your-app.vercel.app
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://vriusyvuqwlozqqcpbke.supabase.co/auth/v1/callback
```

5. Click **"Create"**
6. **Copy your Client ID** (you'll need this for Supabase)

---

## 🐙 **GitHub OAuth Setup**

### 1. Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/profile)
2. Click **"Developer settings"** (bottom left)
3. Click **"OAuth Apps"**
4. Click **"New OAuth App"**

### 2. Configure OAuth App

**Fill out the form:**
- **Application name**: `Meal Planner`
- **Homepage URL**: `https://your-app.vercel.app`
- **Application description**: `Personal meal planning application`
- **Authorization callback URL**: `https://vriusyvuqwlozqqcpbke.supabase.co/auth/v1/callback`

3. Click **"Register application"**
4. **Copy your Client ID**
5. Click **"Generate a new client secret"**
6. **Copy your Client Secret** (you'll only see this once!)

---

## ⚙️ **Configure Supabase**

### 1. Enable OAuth Providers

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your `menuplanner` project
3. Go to **"Authentication"** → **"Providers"**

### 2. Configure Google Provider

1. Find **"Google"** in the provider list
2. Toggle it **ON**
3. **Client ID**: Paste your Google Client ID
4. **Client Secret**: Leave empty (not needed for public OAuth)
5. **Redirect URL**: Should auto-populate as:
   ```
   https://vriusyvuqwlozqqcpbke.supabase.co/auth/v1/callback
   ```
6. Click **"Save"**

### 3. Configure GitHub Provider

1. Find **"GitHub"** in the provider list
2. Toggle it **ON**
3. **Client ID**: Paste your GitHub Client ID
4. **Client Secret**: Paste your GitHub Client Secret
5. **Redirect URL**: Should auto-populate as:
   ```
   https://vriusyvuqwlozqqcpbke.supabase.co/auth/v1/callback
   ```
6. Click **"Save"**

---

## 🧪 **Test OAuth Integration**

### 1. Test Locally (if running local dev server)

1. Open your app at `http://localhost:3000` (or your local URL)
2. Click **"Login"**
3. Try **"Continue with Google"** or **"Continue with GitHub"**
4. Should redirect to OAuth provider and back

### 2. Test on Production

1. Open your deployed app
2. Click **"Login"**
3. Test both Google and GitHub OAuth
4. Verify user data appears in Supabase dashboard

---

## 🔧 **Troubleshooting**

### Common Issues:

**"redirect_uri_mismatch" error:**
- Check that your redirect URIs exactly match in Google/GitHub and Supabase
- Make sure you're using the correct Supabase project URL

**"unauthorized_client" error:**
- Verify your Client ID is correct
- Check that OAuth consent screen is properly configured

**OAuth buttons don't work:**
- Open browser dev tools and check console for errors
- Verify Supabase credentials are correct in your HTML

**"This app isn't verified" (Google):**
- This is normal for development - click "Advanced" → "Go to Meal Planner (unsafe)"
- For production, submit for Google verification

### Testing Checklist:

- [ ] Google OAuth app created with correct redirect URI
- [ ] GitHub OAuth app created with correct redirect URI
- [ ] Both providers enabled in Supabase
- [ ] Client IDs/secrets added to Supabase
- [ ] App deployed and accessible
- [ ] OAuth buttons work in production

---

## 📝 **Important URLs Summary**

Replace `your-app.vercel.app` with your actual deployed domain:

**Supabase Redirect URI:**
```
https://vriusyvuqwlozqqcpbke.supabase.co/auth/v1/callback
```

**Authorized Origins (Google):**
```
https://your-app.vercel.app
```

**Homepage URL (GitHub):**
```
https://your-app.vercel.app
```

**Authorization Callback URL (GitHub):**
```
https://vriusyvuqwlozqqcpbke.supabase.co/auth/v1/callback
```

Once configured, users will be able to sign in with Google or GitHub, and their accounts will be automatically created in your Supabase database! 🚀