# 🚀 One-Click Deployment Guide

## Quick Deploy (5 minutes)

### Prerequisites
- GitHub account
- Railway account (free tier available)
- Vercel account (free tier available)

---

## 🎯 OPTION 1: Automated Deployment (Recommended)

### Step 1: Run Deployment Script

**On Windows:**
```bash
deploy.bat
```

**On Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- ✅ Initialize Git repository
- ✅ Guide you through Railway deployment
- ✅ Guide you through Vercel deployment
- ✅ Configure environment variables

---

## 🎯 OPTION 2: Manual Deployment

### Part A: Deploy Backend to Railway

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Deploy to Railway"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Django ✅
   - Click "Deploy"

3. **Add Environment Variables in Railway**
   
   Click on your service → Variables → Add the following:
   
   ```env
   SECRET_KEY=your-super-secret-random-key-here-change-this
   DEBUG=False
   ALLOWED_HOSTS=${{RAILWAY_PUBLIC_DOMAIN}}
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

4. **Add PostgreSQL (Optional but Recommended)**
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway automatically connects it (DATABASE_URL is set automatically)

5. **Copy Your Railway URL**
   - Example: `https://chemical-equipment-visualizer-production.up.railway.app`

### Part B: Deploy Frontend to Vercel

1. **Deploy on Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Add Environment Variables in Vercel**
   
   Settings → Environment Variables → Add:
   
   ```env
   VITE_API_URL=https://your-railway-url.railway.app/api
   VITE_WS_URL=wss://your-railway-url.railway.app/ws
   ```
   
   **Replace** `your-railway-url.railway.app` with your actual Railway URL from Part A

3. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend

---

## 🎯 OPTION 3: Deploy to Render (All-in-One)

### Backend (Django)

1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Name:** chemical-equipment-backend
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `daphne -b 0.0.0.0 -p $PORT backend.asgi:application`

5. Environment Variables:
   ```env
   SECRET_KEY=your-secret-key
   DEBUG=False
   ALLOWED_HOSTS=chemical-equipment-backend.onrender.com,your-frontend.onrender.com
   PYTHON_VERSION=3.11
   ```

### Frontend (React/Vite)

1. New → Static Site
2. Connect same GitHub repo
3. Settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

4. Environment Variables:
   ```env
   VITE_API_URL=https://chemical-equipment-backend.onrender.com/api
   VITE_WS_URL=wss://chemical-equipment-backend.onrender.com/ws
   ```

---

## 🔧 After Deployment

### 1. Update Backend CORS Settings

In Railway/Render backend environment variables, update:
```env
CORS_ALLOWED_ORIGINS=https://your-actual-frontend-domain.vercel.app
ALLOWED_HOSTS=your-backend.railway.app,your-frontend.vercel.app
```

### 2. Test Your Deployment

1. Visit your Vercel frontend URL
2. Try logging in (admin / password123)
3. Upload a CSV file
4. Check if data syncs properly

### 3. Create Admin User on Backend

In Railway/Render, go to the terminal and run:
```bash
python manage.py createsuperuser
```

---

## 📱 URLs After Deployment

After successful deployment, you'll have:

- **Frontend (Web App):** https://your-app.vercel.app
- **Backend API:** https://your-app.railway.app/api
- **Desktop App:** Still works locally, just update API_BASE_URL in desktop/app.py

---

## 🎨 Custom Domain (Optional)

### For Vercel (Frontend)
1. Go to your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### For Railway (Backend)
1. Go to your service → Settings
2. Add custom domain
3. Configure DNS

---

## 🔐 Security Checklist

After deployment, verify:

- ✅ DEBUG=False in production
- ✅ SECRET_KEY is random and secure
- ✅ ALLOWED_HOSTS is properly configured
- ✅ CORS_ALLOWED_ORIGINS is set to your frontend domain only
- ✅ Database backups are enabled (if using PostgreSQL)
- ✅ Change default admin password from 'password123'

---

## 🆘 Troubleshooting

### Backend won't start
- Check Railway logs
- Verify all environment variables are set
- Ensure requirements.txt has all dependencies

### Frontend can't connect to backend
- Verify VITE_API_URL is correct in Vercel
- Check CORS_ALLOWED_ORIGINS in Railway
- Ensure Railway backend is running

### Database errors
- Run migrations: `python manage.py migrate`
- Check DATABASE_URL is properly set

---

## 💰 Cost Estimate

### Free Tier (Suitable for Development/Demo)
- **Railway:** 500 hours/month free
- **Vercel:** Unlimited for personal projects
- **Total:** $0/month

### Paid Tier (Production)
- **Railway Hobby:** $5/month (includes PostgreSQL)
- **Vercel Pro:** Free for most projects
- **Total:** ~$5/month

---

## 🎉 Success!

Your Chemical Equipment Parameter Visualizer is now live and accessible from anywhere!

Share your deployment URL with stakeholders and enjoy your cloud-hosted application.
