@echo off
echo ====================================
echo Chemical Equipment Visualizer
echo Deployment Setup
echo ====================================
echo.

REM Check if Git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit for deployment"
) else (
    echo Git repository already initialized
    echo Committing latest changes...
    git add .
    git commit -m "Preparing for deployment" || echo No changes to commit
)

echo.
echo ====================================
echo DEPLOYMENT OPTIONS
echo ====================================
echo.
echo 1. Railway (Backend) + Vercel (Frontend) - RECOMMENDED
echo 2. Render (Full Stack)
echo 3. Heroku (Full Stack)
echo.
echo ====================================
echo STEP 1: Backend Deployment (Railway)
echo ====================================
echo.
echo 1. Go to https://railway.app
echo 2. Sign in with GitHub
echo 3. Click "New Project" -^> "Deploy from GitHub repo"
echo 4. Select this repository
echo 5. Railway will auto-detect and deploy Django
echo.
echo 6. Add Environment Variables in Railway:
echo    - SECRET_KEY = (generate a strong random key)
echo    - DEBUG = False
echo    - ALLOWED_HOSTS = your-app.railway.app
echo    - CORS_ALLOWED_ORIGINS = https://your-frontend.vercel.app
echo.
echo 7. OPTIONAL: Add PostgreSQL database:
echo    - Click "New" -^> "Database" -^> "PostgreSQL"
echo    - DATABASE_URL will be auto-set
echo.
echo 8. Copy your Railway backend URL (e.g., https://yourapp.railway.app)
echo.
pause

echo.
echo ====================================
echo STEP 2: Frontend Deployment (Vercel)
echo ====================================
echo.
echo 1. Go to https://vercel.com
echo 2. Sign in with GitHub
echo 3. Click "New Project" -^> Import your GitHub repo
echo 4. Configure:
echo    - Framework Preset: Vite
echo    - Build Command: npm run build
echo    - Output Directory: dist
echo.
echo 5. Add Environment Variables in Vercel:
echo    - VITE_API_URL = https://your-railway-url.railway.app/api
echo    - VITE_WS_URL = wss://your-railway-url.railway.app/ws
echo.
echo 6. Click "Deploy"
echo.
pause

echo.
echo ====================================
echo DEPLOYMENT COMPLETE!
echo ====================================
echo.
echo Your app should now be live at:
echo Frontend: https://your-app.vercel.app
echo Backend: https://your-app.railway.app
echo.
echo Next Steps:
echo - Test the frontend at your Vercel URL
echo - Upload CSV files to test backend connectivity
echo - Update ALLOWED_HOSTS and CORS settings if needed
echo.
echo For detailed instructions, see DEPLOYMENT.md
echo.
pause
