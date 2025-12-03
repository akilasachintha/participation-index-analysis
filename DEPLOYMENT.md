# Deployment Guide

## Deploy to Vercel (Recommended - FREE)

### Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com with GitHub)
- Supabase project already set up

### Step-by-Step Deployment

#### 1. Push Code to GitHub
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

#### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: ./
   - **Build Command**: `pnpm run build` (or leave default)
   - **Output Directory**: .next (default)

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add these variables from your `.env` file:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://itrpormdnokfjlrnyznz.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnBvcm1kbm9rZmpscm55em56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDk5MDksImV4cCI6MjA4MDMyNTkwOX0.pK8jGe-WB3OdJ64DdidN9Voien1C0ISdfOORGxkfLFs
     ```

6. Click "Deploy"

#### 3. Setup Supabase Database

If you haven't already, run the SQL scripts in your Supabase SQL Editor:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run `scripts/001_create_tables.sql`
4. Run `scripts/002_fix_categories_policies.sql`

### Free Tier Limits
- **Vercel**: Unlimited deployments, 100GB bandwidth/month
- **Supabase**: 500MB database, 1GB file storage, 50MB file uploads

### Your App Will Be Available At:
`https://your-project-name.vercel.app`

### Auto-Deployments
Every push to the `main` branch will automatically deploy to production!

---

## Alternative: Deploy to Netlify (Also FREE)

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Build settings:
   - Build command: `pnpm run build`
   - Publish directory: `.next`
5. Add environment variables in Site settings → Environment variables
6. Deploy!

---

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Ensure `.env.local` is in `.gitignore` (don't commit secrets!)
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify Supabase URL and anon key are correct
- Check RLS policies are properly set up
- Ensure Supabase project is not paused (free tier pauses after 1 week of inactivity)

### Images Not Loading
- If using Supabase Storage, ensure bucket policies allow public access
- Check CORS settings in Supabase Storage

---

## Post-Deployment

1. Test all features on the live site
2. Update Supabase URL allowed origins if needed (Project Settings → API → URL Configuration)
3. Monitor usage in Vercel and Supabase dashboards
