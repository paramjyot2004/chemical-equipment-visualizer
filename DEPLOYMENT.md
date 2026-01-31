# Chemical Equipment Parameter Visualizer - Deployment Guide

## 🚀 Quick Deploy

### Option 1: Deploy to Railway + Vercel (Recommended)

#### Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Install Railway CLI (optional)
   npm install -g @railway/cli
   
   # Or deploy via GitHub:
   # - Push your code to GitHub
   # - Connect Railway to your GitHub repo
   # - Railway will auto-detect Django and deploy
   ```

3. **Configure Environment Variables in Railway**
   ```
   SECRET_KEY=your-secret-key-here-generate-a-strong-one
   DEBUG=False
   ALLOWED_HOSTS=your-app.railway.app,your-frontend-domain.vercel.app
   CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
   ```

4. **Add PostgreSQL Database** (Optional but recommended)
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway automatically sets DATABASE_URL

5. **Add Redis** (Optional for production WebSocket)
   - In Railway dashboard, click "New" → "Database" → "Redis"
   - Railway automatically sets REDIS_URL

6. **Run Migrations**
   - Railway runs migrations automatically
   - Or manually: `railway run python manage.py migrate`

#### Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Import your GitHub repository
   - Vercel auto-detects Vite
   - Configure build settings (already set in vercel.json)

3. **Set Environment Variables in Vercel**
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_WS_URL=wss://your-backend.railway.app/ws
   ```

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at https://your-app.vercel.app

---

### Option 2: Deploy to Render (All-in-One)

#### Backend on Render

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `daphne -b 0.0.0.0 -p $PORT backend.asgi:application`
   - **Environment**: Python 3

5. Add environment variables (same as Railway above)

6. Create a PostgreSQL database (Render's dashboard)

#### Frontend on Render

1. Create a new "Static Site"
2. Connect your GitHub repo
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Add environment variables

---

### Option 3: Deploy to DigitalOcean/AWS/Azure

For production-grade deployment:

1. **Backend**: Deploy Django with Gunicorn/Daphne behind Nginx
2. **Database**: Managed PostgreSQL
3. **Redis**: Managed Redis for Channels
4. **Frontend**: Serve from Nginx or CDN (CloudFlare, AWS CloudFront)
5. **SSL**: Use Let's Encrypt or managed SSL

---

## 📦 Desktop App Distribution

The PyQt5 desktop app runs locally. To distribute:

### Using PyInstaller

```bash
# Install PyInstaller
pip install pyinstaller

# Create executable
pyinstaller --onefile --windowed desktop/app.py

# Executable will be in dist/ folder
```

### Using cx_Freeze

```bash
pip install cx_Freeze
python setup.py build
```

Users can download and run the executable, which will connect to your deployed backend.

---

## 🔧 Post-Deployment Checklist

- [ ] Update `ALLOWED_HOSTS` in backend settings
- [ ] Set strong `SECRET_KEY` in production
- [ ] Configure CORS with your frontend domain
- [ ] Set `DEBUG=False` in production
- [ ] Use PostgreSQL instead of SQLite for production
- [ ] Enable Redis for production WebSocket support
- [ ] Set up SSL/HTTPS for both backend and frontend
- [ ] Configure static file serving with WhiteNoise
- [ ] Set up monitoring and logging
- [ ] Create admin user: `python manage.py createsuperuser`

---

## 🌐 Quick Deploy Commands

### Deploy with Railway CLI

```bash
# Login
railway login

# Link to project (or create new)
railway link

# Deploy
railway up
```

### Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

---

## 📝 Environment Variables Summary

### Backend (.env)
```env
SECRET_KEY=<generate-strong-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-app.railway.app
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.local)
```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_WS_URL=wss://your-backend.railway.app/ws
```

---

## 🎯 Testing Deployment

1. **Backend Health Check**
   ```bash
   curl https://your-backend.railway.app/api/equipment/
   ```

2. **Frontend Check**
   - Visit https://your-frontend.vercel.app
   - Upload a CSV file
   - Verify real-time updates work

3. **Desktop App**
   - Update `API_BASE_URL` and `WS_URL` in `desktop/app.py`
   - Point to your deployed backend
   - Test connectivity

---

## 🔐 Security Notes

- Always use HTTPS in production
- Enable CSRF protection
- Use strong SECRET_KEY
- Limit CORS origins to specific domains
- Use environment variables for sensitive data
- Regular security updates
- Rate limiting for API endpoints

---

## 📊 Monitoring

- Railway/Render provide built-in logs
- Set up error tracking (Sentry)
- Monitor database performance
- Track WebSocket connections
- API response times

---

## 🆘 Troubleshooting

**Issue**: Static files not loading
- **Solution**: Run `python manage.py collectstatic` and ensure WhiteNoise is configured

**Issue**: WebSocket not connecting
- **Solution**: Ensure Redis is configured in production; use `wss://` not `ws://`

**Issue**: CORS errors
- **Solution**: Update `CORS_ALLOWED_ORIGINS` with your frontend domain

**Issue**: Database migrations fail
- **Solution**: Run manually: `railway run python manage.py migrate`

---

Ready to deploy! 🚀
