#!/bin/bash

echo "======================================"
echo "  Chemical Equipment Visualizer"
echo "  Quick Deployment to Railway + Vercel"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo -e "${BLUE}Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit for deployment"
else
    echo -e "${GREEN}Git repository already initialized${NC}"
    git add .
    git commit -m "Preparing for deployment" || echo "No changes to commit"
fi

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo -e "${BLUE}Creating GitHub repository...${NC}"
    gh repo create chemical-equipment-visualizer --public --source=. --remote=origin || echo "Repository might already exist"
    git push -u origin main || git push -u origin master
else
    echo -e "${RED}GitHub CLI not found. Please create repository manually:${NC}"
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository named 'chemical-equipment-visualizer'"
    echo "3. Run: git remote add origin YOUR_REPO_URL"
    echo "4. Run: git push -u origin main"
    echo ""
    read -p "Press Enter after creating GitHub repository..."
fi

echo ""
echo -e "${GREEN}======================================"
echo "  Deployment Instructions"
echo "======================================${NC}"
echo ""

# Backend Deployment (Railway)
echo -e "${BLUE}BACKEND DEPLOYMENT (Railway):${NC}"
echo "1. Visit: https://railway.app/new"
echo "2. Select 'Deploy from GitHub repo'"
echo "3. Choose your repository"
echo "4. Railway will auto-deploy!"
echo ""
echo "Environment Variables to add in Railway:"
echo "  • SECRET_KEY: $(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')"
echo "  • DEBUG: False"
echo "  • ALLOWED_HOSTS: \${{RAILWAY_PUBLIC_DOMAIN}}"
echo ""
echo -e "${GREEN}Copy your Railway URL:${NC} https://________.railway.app"
read -p "Enter your Railway backend URL (e.g., https://myapp.railway.app): " BACKEND_URL

# Update environment template
echo "VITE_API_URL=${BACKEND_URL}/api" > .env.production
echo "VITE_WS_URL=${BACKEND_URL/https/wss}/ws" >> .env.production

# Frontend Deployment (Vercel)
echo ""
echo -e "${BLUE}FRONTEND DEPLOYMENT (Vercel):${NC}"
echo "1. Visit: https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Framework: Vite"
echo "4. Add these Environment Variables:"
echo "   • VITE_API_URL = ${BACKEND_URL}/api"
echo "   • VITE_WS_URL = ${BACKEND_URL/https/wss}/ws"
echo "5. Click Deploy!"
echo ""

# Generate .env.production for reference
echo ""
echo -e "${GREEN}Created .env.production file with your settings!${NC}"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo -e "${BLUE}Railway CLI detected! Deploying backend...${NC}"
    railway init
    railway up
    echo -e "${GREEN}Backend deployed!${NC}"
else
    echo -e "${BLUE}Install Railway CLI for automatic deployment:${NC}"
    echo "npm install -g @railway/cli"
fi

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo -e "${BLUE}Vercel CLI detected! Deploying frontend...${NC}"
    vercel --prod
    echo -e "${GREEN}Frontend deployed!${NC}"
else
    echo -e "${BLUE}Install Vercel CLI for automatic deployment:${NC}"
    echo "npm install -g vercel"
fi

echo ""
echo -e "${GREEN}======================================"
echo "  Deployment Summary"
echo "======================================${NC}"
echo ""
echo "✓ Git repository initialized and pushed"
echo "✓ Environment configuration created"
echo "✓ Ready for Railway + Vercel deployment"
echo ""
echo "Visit DEPLOYMENT.md for detailed instructions"
echo ""
