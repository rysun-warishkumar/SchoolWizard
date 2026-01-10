# SchoolWizard - Deployment Guide for Render + Hostinger MySQL

Complete guide to deploy SchoolWizard on Render (Backend & Frontend) with Hostinger MySQL database.

## 🚀 Quick Start Summary

**Estimated Time**: 30-45 minutes

1. **Database** (5 min): Create MySQL database on Hostinger, import schema
2. **Backend** (10 min): Deploy backend service on Render, configure environment variables
3. **Frontend** (10 min): Deploy frontend static site on Render, configure API URL
4. **Public Portal** (10 min): Deploy SchoolPortal static site on Render
5. **Testing** (10 min): Test login, verify connections, update CORS

**Total Cost**: 
- Render: Free tier available (services spin down after 15 min inactivity)
- Hostinger: Depends on your hosting plan (usually includes MySQL)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Hostinger MySQL)](#database-setup-hostinger-mysql)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Render)](#frontend-deployment-render)
5. [Public School Portal Deployment (Render)](#public-school-portal-deployment-render)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Deployment Checklist](#deployment-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Custom Domain Setup](#custom-domain-setup-optional)
11. [Additional Tips & Best Practices](#additional-tips--best-practices)

---

## Prerequisites

- **Render Account**: Sign up at [render.com](https://render.com) (Free tier available)
- **Hostinger Account**: With MySQL database access
- **GitHub Account**: For connecting repository to Render
- **Domain Name** (optional): For custom domain setup

---

## Database Setup (Hostinger MySQL)

### Step 1: Create Database on Hostinger

1. **Login to Hostinger Control Panel** (hPanel)
2. **Navigate to Databases** → **MySQL Databases**
3. **Create New Database**:
   - Database Name: `schoolwizard` (or your preferred name)
   - Username: (auto-generated or custom)
   - Password: (create a strong password)
   - **Note**: Save these credentials - you'll need them for backend configuration

4. **Enable Remote MySQL** (Required for Render):
   - Go to **Databases** → **Remote MySQL**
   - Add Render's IP address (or use `%` for all IPs - less secure but easier)
   - **Note**: Render IPs change, so using `%` might be necessary

### Step 2: Import Database Schema

#### Option A: Using phpMyAdmin (Recommended)

1. **Access phpMyAdmin**:
   - Hostinger hPanel → **Databases** → **phpMyAdmin**
   - Select your database from left sidebar

2. **Import SQL File**:
   - Click **"Import"** tab
   - Click **"Choose File"** button
   - Navigate to: `database/consolidated/00_complete_database.sql`
   - Select the file
5. **Import Settings**:
   - **Format**: SQL (should be auto-detected)
   - **Partial import**: Leave unchecked
   - **Character set**: utf8mb4 (default)
6. **Click "Go"** button at bottom
7. **Wait for import** to complete (may take 1-2 minutes for large files)
8. **Verify Import**:
   - Check left sidebar - you should see many tables created
   - Look for tables like `users`, `students`, `classes`, etc.

#### Option B: Using MySQL Command Line

```bash
# If you have MySQL client installed locally
mysql -h mysql.hostinger.com -u schoolwizard_user -p schoolwizard < database/consolidated/00_complete_database.sql

# Enter password when prompted
```

#### Option C: Using Hostinger File Manager

1. **Upload SQL file**:
   - Go to Hostinger hPanel → **File Manager**
   - Navigate to `public_html` or any accessible directory
   - Upload `database/consolidated/00_complete_database.sql`
2. **Import via phpMyAdmin**:
   - Access phpMyAdmin
   - Select your database
   - Go to Import tab
   - Choose "Browse your computer" or "Select from the web server"
   - Select the uploaded file
   - Click Go

**After Import**:
- Verify default admin user exists:
  - Email: `admin@schoolwizard.com`
  - Password: `admin123`
- Check that all tables are created (should be 50+ tables)

---

## Backend Deployment (Render)

### Step 1: Prepare Backend for Production

1. **Update `backend/package.json`** (if needed):
   ```json
   {
     "scripts": {
       "start": "node dist/index.js",
       "build": "tsc && node scripts/fix-imports.js"
     }
   }
   ```

2. **Create `backend/render.yaml`** (optional, for Blueprint):
   ```yaml
   services:
     - type: web
       name: schoolwizard-backend
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 10000
   ```

### Step 2: Deploy Backend on Render

1. **Login to Render Dashboard**
2. **Create New Web Service**:
   - Click **"New +"** → **"Web Service"**
   - **Connect repository**: GitHub/GitLab/Bitbucket
   - **Repository**: Select your `SchoolWizard` repository
   - **Branch**: `main` (or your default branch)

3. **Configure Service**:
   - **Name**: `schoolwizard-backend` (or any name)
   - **Region**: Choose closest to your users
   - **Root Directory**: `backend` ⚠️ **Important**: Set this!
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Add Environment Variables** (see [Environment Variables](#environment-variables) section below)

5. **Deploy**:
   - Click **"Create Web Service"**
   - Render will automatically:
     - Clone your repository
     - Install dependencies
     - Build the application
     - Start the server

6. **Wait for Deployment**:
   - First deployment takes 5-10 minutes
   - Monitor build logs for any errors
   - Once deployed, note your backend URL: `https://schoolwizard-backend.onrender.com`

### Step 3: Verify Backend Deployment

1. **Check Health Endpoint**:
   - Visit: `https://schoolwizard-backend.onrender.com/health`
   - Should return: `{ "status": "OK", "message": "Server is running" }`

2. **Check API Endpoint**:
   - Visit: `https://schoolwizard-backend.onrender.com/api/v1/auth/login`
   - Should return method not allowed (POST required) or similar - means server is running

3. **Check Logs**:
   - Render Dashboard → Your Backend Service → **Logs** tab
   - Look for database connection messages
   - Should see: `✅ MySQL connection established` or similar

---

## Frontend Deployment (Render)

### Step 1: Prepare Frontend for Production

1. **Create `.env.production`** (optional, can set in Render):
   ```env
   VITE_API_BASE_URL=https://schoolwizard-backend.onrender.com/api/v1
   ```

2. **Verify Build**:
   ```bash
   cd frontend
   npm install
   npm run build
   # Should create dist/ folder with no errors
   ```

### Step 2: Deploy Frontend as Static Site on Render

⚠️ **CRITICAL**: Deploy as **"Static Site"**, NOT "Web Service"!

1. **Go to Render Dashboard**:
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click **"New +"** → **"Static Site"** ⚠️ **NOT "Web Service"**

2. **Connect Repository**:
   - **Connect account**: GitHub/GitLab/Bitbucket
   - **Repository**: Select your `SchoolWizard` repository
   - **Branch**: `main` (or your default branch)

3. **Configure Build Settings**:
   - **Name**: `schoolwizard-frontend` (or any name)
   - **Root Directory**: `frontend` ⚠️ **Important**: Set this to `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist` ⚠️ **Important**: Set this to `dist`

4. **Add Environment Variables**:
   - Click **"Environment"** tab
   - Add variable:
     ```
     Key: VITE_API_BASE_URL
     Value: https://schoolwizard-backend.onrender.com/api/v1
     ```
   - **Important**: Replace with your actual backend URL!

5. **Configure Redirects** (for SPA routing):
   - Go to **Settings** → **Redirects/Rewrites**
   - Add redirect:
     - **Source Path**: `/*`
     - **Destination Path**: `/index.html`
     - **Status Code**: `200` (NOT 301/302)
   - This ensures client-side routing works on refresh

6. **Deploy**:
   - Click **"Create Static Site"**
   - Render will automatically build and deploy
   - Wait for deployment to complete (3-5 minutes)

7. **Note Your Frontend URL**:
   - After deployment, note the URL: `https://schoolwizard-frontend.onrender.com`
   - You'll need this for CORS configuration

### Step 3: Verify Frontend Deployment

1. **Check Deployment Status**:
   - Render Dashboard → Your Static Site → **Logs** tab
   - Should see: `✓ Build successful`
   - Should see: `✓ Deployed successfully`

2. **Test Frontend**:
   - Visit your frontend URL
   - Should see login page
   - Try logging in with default credentials:
     - Email: `admin@schoolwizard.com`
     - Password: `admin123`

### ⚠️ Common Mistake: Deployed as Web Service Instead of Static Site

**Error**: `Error: Cannot find module '/opt/render/project/src/frontend/index.js'`

**This means you created a Web Service instead of a Static Site!**

**Fix Steps**:
1. **Delete the Web Service**:
   - Go to Render Dashboard
   - Find your frontend service
   - Click **Settings** → Scroll down → **Delete Service**
   - Confirm deletion
2. **Create a Static Site** (follow Step 2 above)
   - Make sure to select **"Static Site"** not "Web Service"
   - Set **Root Directory** to `frontend`
   - Set **Publish Directory** to `dist`

---

## Environment Variables

### Backend Environment Variables (Render)

Add these in Render Dashboard → Your Backend Service → Environment:

```env
# Server
NODE_ENV=production
PORT=10000

# Database (Hostinger MySQL)
DB_HOST=mysql.hostinger.com
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306

# JWT (Required - minimum 32 characters)
JWT_SECRET=generate-a-very-long-random-string-here-minimum-32-characters
JWT_EXPIRE=7d

# CORS (Required for frontend to access API)
CORS_ORIGINS=https://schoolwizard-frontend.onrender.com,https://schoolwizard-portal.onrender.com
```

**Generate JWT_SECRET**:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use online generator: https://randomkeygen.com/
```

**⚠️ CRITICAL CORS Configuration**:
- Use `CORS_ORIGINS` (plural) for multiple origins
- Format: `url1,url2` (comma-separated, NO spaces)
- Include BOTH frontend and portal URLs
- Use `https://` (not `http://`)
- No trailing slashes

### Frontend Environment Variables (Render)

Add these in Render Dashboard → Your Frontend Service → Environment:

```env
VITE_API_BASE_URL=https://schoolwizard-backend.onrender.com/api/v1
```

**Important**: Replace with your actual backend URL!

### SchoolPortal Environment Variables (Render)

Add these in Render Dashboard → Your SchoolPortal Service → Environment:

```env
VITE_API_BASE_URL=https://schoolwizard-backend.onrender.com/api/v1
```

**Important**: 
- Replace with your actual backend URL
- Must include `/api/v1` at the end
- Same URL as your main frontend uses

---

## Post-Deployment Configuration

### Step 1: Update Backend CORS (REQUIRED)

**⚠️ CRITICAL**: You MUST configure backend CORS to include BOTH the admin frontend AND the public portal URLs. Missing either one will cause CORS errors.

1. **Go to Render Dashboard**:
   - Navigate to your Backend Service → **Environment** tab

2. **Configure CORS_ORIGINS**:
   - **If `CORS_ORIGINS` exists**: Update it to include both URLs:
     ```
     CORS_ORIGINS=https://schoolwizard-0bcm.onrender.com,https://schoolwizard-portal.onrender.com
     ```
   - **If only `CORS_ORIGIN` exists**: 
     - Delete `CORS_ORIGIN`
     - Create new variable `CORS_ORIGINS` with:
       ```
       CORS_ORIGINS=https://schoolwizard-0bcm.onrender.com,https://schoolwizard-portal.onrender.com
       ```
   - **If neither exists**: Create `CORS_ORIGINS` with both URLs
   
   **⚠️ IMPORTANT FORMATTING**:
   - Use `https://` (not `http://`)
   - No trailing slashes (no `/` at the end)
   - Comma-separated with NO spaces: `url1,url2` (NOT `url1, url2`)
   - Replace with your actual URLs:
     - Admin Frontend: `https://your-frontend-url.onrender.com`
     - Public Portal: `https://your-portal-url.onrender.com`

3. **Example (Replace with Your URLs)**:
   ```
   CORS_ORIGINS=https://schoolwizard-0bcm.onrender.com,https://schoolwizard-portal.onrender.com
   ```

4. **Save and Wait**:
   - Click **Save Changes**
   - Render will automatically redeploy the backend (takes 1-2 minutes)
   - **DO NOT** make other changes during this time
   - Monitor the logs to ensure deployment succeeds

5. **Verify CORS is Working**:
   - **For Admin Frontend**:
     - Refresh the admin dashboard
     - Open browser console (F12) → Network tab
     - Check that API calls succeed (200 status)
     - No CORS errors should appear
   - **For Public Portal**:
     - Refresh the portal website
     - Open browser console (F12) → Network tab
     - Check that public API calls succeed (200 status)
     - No CORS errors should appear

6. **If CORS Errors Persist**:
   - Double-check the URLs match exactly (case-sensitive, no trailing slashes)
   - Verify both URLs are in the same `CORS_ORIGINS` variable (comma-separated)
   - Clear browser cache and try again
   - Check backend logs for CORS warnings
   - Try in incognito/private window

### Step 2: Test Database Connection

1. **Check Render Backend Logs**:
   - Go to Render Dashboard → Your Backend Service → **Logs** tab
   - Look for database connection messages
   - **Success**: Should see `✅ MySQL connection established` or similar
   - **Failure**: Will see error messages like `ECONNREFUSED`, `ETIMEDOUT`, or authentication errors

2. **If Connection Fails** - Common Issues:

   **Issue A: Wrong Database Host**
   - **Symptom**: `ECONNREFUSED` or `ETIMEDOUT`
   - **Solution**: 
     - Check Hostinger hPanel for exact database host
     - Common hosts: `localhost`, `mysql.hostinger.com`, `mysql.hostinger.in`
     - Update `DB_HOST` in Render environment variables

   **Issue B: Remote MySQL Not Enabled**
   - **Symptom**: `ECONNREFUSED`
   - **Solution**:
     - Hostinger hPanel → Databases → **Remote MySQL**
     - Add Render server IP (or use `%` for all IPs - less secure)
     - Wait 5-10 minutes for changes to propagate

   **Issue C: Wrong Credentials**
   - **Symptom**: `ER_ACCESS_DENIED_ERROR` or authentication errors
   - **Solution**:
     - Double-check username, password, database name
     - Test connection using phpMyAdmin with same credentials
     - Ensure user has ALL PRIVILEGES on database

   **Issue D: Firewall Blocking**
   - **Symptom**: `ETIMEDOUT`
   - **Solution**:
     - Some Hostinger plans block external MySQL connections
     - Contact Hostinger support to whitelist Render IPs
     - Or upgrade to plan that supports remote MySQL

3. **Test Connection Manually** (if you have MySQL client):
   ```bash
   mysql -h mysql.hostinger.com -u schoolwizard_user -p schoolwizard
   # Enter password when prompted
   # If connection succeeds, credentials are correct
   ```

### Step 3: Test API Endpoints

1. **Test Backend is Running**:
   - Open browser: `https://schoolwizard-backend.onrender.com`
   - Should see some response (even if it's an error, means server is running)
   - Or test: `https://schoolwizard-backend.onrender.com/api/v1/auth/login` (should return method not allowed or similar)

2. **Test Login Endpoint** (using Postman, curl, or browser console):

   **Using curl**:
   ```bash
   curl -X POST https://schoolwizard-backend.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@schoolwizard.com","password":"admin123"}'
   ```

   **Using Postman**:
   - Method: `POST`
   - URL: `https://schoolwizard-backend.onrender.com/api/v1/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "email": "admin@schoolwizard.com",
       "password": "admin123"
     }
     ```

3. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": { ... }
     }
   }
   ```

### Step 4: Fix Admin Password (if getting "Invalid credentials")

If login fails with "Invalid credentials", the admin password might not be set correctly:

1. **Access phpMyAdmin**:
   - Hostinger hPanel → Databases → phpMyAdmin
   - Select your database

2. **Run SQL Query**:
   ```sql
   USE your_database_name;

   -- Update admin password to 'admin123' (bcrypt hash)
   UPDATE users
   SET password = '$2a$10$LO7O/f4lNC5tHZf1yr1ObuiD/r8PiQN9SQZ22rXSLicXXoo/oB1Ca',
       is_active = 1,
       role_id = 1
   WHERE email = 'admin@schoolwizard.com';

   -- Verify the update
   SELECT
       id,
       email,
       name,
       role_id,
       is_active,
       SUBSTRING(password, 1, 30) as password_hash_preview
   FROM users
   WHERE email = 'admin@schoolwizard.com';
   ```

3. **Test Login Again**:
   - Go to frontend login page
   - Email: `admin@schoolwizard.com`
   - Password: `admin123`

---

## Public School Portal Deployment (Render)

The **SchoolPortal** is a separate public-facing website that displays your school's information, news, events, gallery, etc. It's a standalone React application that needs to be hosted separately.

### Step 1: Prepare SchoolPortal for Deployment

1. **Verify SchoolPortal Structure**:
   - Ensure `SchoolPortal/` folder exists in your repository
   - Check that `SchoolPortal/package.json` and `SchoolPortal/vite.config.ts` exist

2. **Create Environment File** (optional, can be set in Render):
   - Create `SchoolPortal/.env.example`:
     ```env
     VITE_API_BASE_URL=http://localhost:5000
     ```
   - **Note**: For production, set this in Render Dashboard (see Step 3)

### Step 2: Deploy SchoolPortal as Static Site on Render

1. **Go to Render Dashboard**:
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click **"New +"** → **"Static Site"**

2. **Connect Repository**:
   - **Connect account**: GitHub/GitLab/Bitbucket
   - **Repository**: Select your `SchoolWizard` repository
   - **Branch**: `main` (or your default branch)

3. **Configure Build Settings**:
   - **Name**: `schoolwizard-portal` (or any name you prefer)
   - **Root Directory**: `SchoolPortal` ⚠️ **Important**: Set this to `SchoolPortal`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variables**:
   - Click **"Environment"** tab
   - Add variable:
     ```
     Key: VITE_API_BASE_URL
     Value: https://schoolwizard-backend.onrender.com/api/v1
     ```
   - **Important**: 
     - Replace with your actual backend URL
     - Must include `/api/v1` at the end
     - Same URL as your main frontend uses

5. **Configure Redirects** (for SPA routing):
   - Go to **Settings** → **Redirects/Rewrites**
   - Add redirect:
     - **Source Path**: `/*`
     - **Destination Path**: `/index.html`
     - **Status Code**: `200` (NOT 301/302)
   - This ensures client-side routing works on refresh

6. **Deploy**:
   - Click **"Create Static Site"**
   - Render will automatically:
     - Clone your repository
     - Install dependencies
     - Build the application
     - Deploy to CDN

7. **Wait for Deployment**:
   - First deployment takes 3-5 minutes
   - Subsequent deployments are faster (1-2 minutes)
   - Monitor build logs for any errors

### Step 3: Verify SchoolPortal Deployment

1. **Check Deployment Status**:
   - Render Dashboard → Your Static Site → **Logs** tab
   - Should see: `✓ Build successful`
   - Should see: `✓ Deployed successfully`

2. **Test Public Website**:
   - Visit your SchoolPortal URL: `https://schoolwizard-portal.onrender.com`
   - Should see the public school website homepage
   - Test navigation (About, Admission, Gallery, News, Events, Contact)
   - Test that pages load correctly on refresh

3. **Test API Connection**:
   - Open browser console (F12)
   - Check Network tab for API calls
   - Should see successful calls to `/api/v1/public/website/...`
   - If errors, verify `VITE_API_BASE_URL` is correct

### Step 4: Update Backend CORS (REQUIRED)

**⚠️ CRITICAL**: You MUST add the SchoolPortal URL to backend CORS configuration, otherwise the portal won't be able to fetch data from the backend.

1. **Go to Render Dashboard**:
   - Navigate to your Backend Service → **Environment** tab

2. **Configure CORS_ORIGINS**:
   - **If `CORS_ORIGINS` exists**: Update it to include both URLs:
     ```
     CORS_ORIGINS=https://schoolwizard-0bcm.onrender.com,https://schoolwizard-portal.onrender.com
     ```
   - **If only `CORS_ORIGIN` exists**: 
     - Delete `CORS_ORIGIN`
     - Create new variable `CORS_ORIGINS` with:
       ```
       CORS_ORIGINS=https://schoolwizard-0bcm.onrender.com,https://schoolwizard-portal.onrender.com
       ```
   - **If neither exists**: Create `CORS_ORIGINS` with both URLs
   
   **⚠️ IMPORTANT FORMATTING**:
   - Use `https://` (not `http://`)
   - No trailing slashes (no `/` at the end)
   - Comma-separated with NO spaces: `url1,url2` (NOT `url1, url2`)
   - Replace with your actual URLs:
     - Admin Frontend: `https://your-frontend-url.onrender.com`
     - Public Portal: `https://your-portal-url.onrender.com`

3. **Example (Replace with Your URLs)**:
   ```
   CORS_ORIGINS=https://schoolwizard-0bcm.onrender.com,https://schoolwizard-portal.onrender.com
   ```

4. **Save and Wait**:
   - Click **Save Changes**
   - Render will automatically redeploy the backend (takes 1-2 minutes)
   - **DO NOT** make other changes during this time
   - Monitor the logs to ensure deployment succeeds

5. **Verify CORS is Working**:
   - **For Admin Frontend**:
     - Refresh the admin dashboard
     - Open browser console (F12) → Network tab
     - Check that API calls succeed (200 status)
     - No CORS errors should appear
   - **For Public Portal**:
     - Refresh the portal website
     - Open browser console (F12) → Network tab
     - Check that public API calls succeed (200 status)
     - No CORS errors should appear

6. **If CORS Errors Persist**:
   - Double-check the URLs match exactly (case-sensitive, no trailing slashes)
   - Verify both URLs are in the same `CORS_ORIGINS` variable (comma-separated)
   - Clear browser cache and try again
   - Check backend logs for CORS warnings
   - Try in incognito/private window

### Step 5: Configure Public Website Content

1. **Login to Admin Panel**:
   - Go to your main frontend: `https://schoolwizard-frontend.onrender.com`
   - Login as admin

2. **Configure Website Settings**:
   - Navigate to **Front CMS Website** → **Header Configuration**
   - Set:
     - School Logo
     - School Name
     - Tag Line
     - Contact Email & Phone
     - Social Media Links

3. **Add Homepage Banners**:
   - Navigate to **Front CMS Website** → **Home Page Banners**
   - Add banner images with titles, descriptions, and button links
   - Set sort order and activate banners

4. **Add Content** (via other CMS modules):
   - **About Us**: Configure mission, vision, history, etc.
   - **Gallery**: Add gallery categories and images
   - **News & Events**: Publish news articles and events
   - **Admission**: Configure admission information

5. **Verify on Public Website**:
   - Refresh SchoolPortal website
   - Content should appear automatically (fetched from backend)

### Important Notes

- **SchoolPortal is Separate**: It's a completely separate application from the main frontend
- **Same Backend**: Both frontend and SchoolPortal use the same backend API
- **Public Access**: SchoolPortal is publicly accessible (no login required)
- **Content Management**: Content is managed from the admin panel (main frontend)
- **Custom Domain**: You can set up a custom domain for SchoolPortal (e.g., `www.yourschool.com`)

### Troubleshooting SchoolPortal

**Issue: Blank Page / 404 on Refresh**
- **Solution**: Ensure redirects are configured (Step 2, point 5)
- Status code must be `200`, not `301` or `302`

**Issue: API Calls Failing / 401 Unauthorized**

**Symptoms**:
- Console shows `401 (Unauthorized)` errors for public API endpoints
- Error message: "No token provided"
- API calls to `/api/v1/public/...` are failing

**Root Causes & Solutions**:

1. **SchoolPortal Not Rebuilt After Code Changes**:
   - **Symptom**: Error shows `/api/v1/api/public/...` (double `/api/`)
   - **Solution**: 
     - Commit and push all code changes to GitHub
     - Render will automatically rebuild SchoolPortal
     - Wait for deployment to complete (2-3 minutes)
     - Clear browser cache and test again

2. **Backend Routes Not Updated**:
   - **Symptom**: Routes registered at `/api/public/...` instead of `/api/v1/public/...`
   - **Solution**: 
     - Verify backend routes in `backend/src/index.ts` are registered as `/api/v1/public/...`
     - Backend should auto-redeploy after code push
     - Check backend logs to ensure routes are registered correctly

3. **CORS Configuration Missing Portal URL**:
   - **Symptom**: CORS errors in console
   - **Solution**: 
     - Add SchoolPortal URL to backend `CORS_ORIGINS` environment variable
     - Format: `https://schoolwizard-frontend.onrender.com,https://schoolwizard-portal.onrender.com`
     - Wait for backend to redeploy

4. **Route Order Issue** (if routes are being matched incorrectly):
   - **Solution**: Public routes should be registered in `backend/src/index.ts` and should NOT have authentication middleware
   - Verify `publicAdmissionRoutes`, `publicCmsWebsiteRoutes`, etc. don't use `router.use(authenticate)`

**Quick Fix Checklist**:
- [ ] All API paths in `SchoolPortal/src/services/api.ts` use `/public/...` (not `/api/public/...`)
- [ ] Backend routes registered at `/api/v1/public/...` in `backend/src/index.ts`
- [ ] SchoolPortal rebuilt and redeployed on Render
- [ ] Backend CORS_ORIGINS includes SchoolPortal URL
- [ ] Browser cache cleared
- [ ] Test in incognito/private window

**Issue: Content Not Loading**
- **Solution**: 
  - Verify backend is running and accessible
  - Check that public API endpoints are working: `/api/v1/public/website/website-settings`
  - Ensure content is configured in admin panel

**Issue: Build Fails**
- **Solution**:
  - Check build logs in Render Dashboard
  - Verify `Root Directory` is set to `SchoolPortal`
  - Ensure `package.json` exists in SchoolPortal folder
  - Check for TypeScript/compilation errors

---

## Deployment Checklist

### Pre-Deployment
- [ ] Database created on Hostinger
- [ ] Database schema imported successfully
- [ ] All code pushed to GitHub repository
- [ ] Environment variables prepared

### Backend Deployment
- [ ] Backend **Web Service** created on Render (NOT Static Site!)
- [ ] Root directory set to `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] All environment variables added (DB, JWT, CORS)
- [ ] Backend deployed successfully (no build errors)
- [ ] Backend URL noted
- [ ] Health endpoint working: `/health`
- [ ] Database connection successful (check logs)

### Frontend Deployment
- [ ] Frontend **Static Site** created on Render (NOT Web Service!)
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] Environment variable added: `VITE_API_BASE_URL` (with backend URL)
- [ ] Frontend deployed successfully (no "Cannot find module index.js" error)
- [ ] Frontend URL noted
- [ ] Backend CORS_ORIGINS updated with frontend URL

### SchoolPortal Deployment
- [ ] SchoolPortal **Static Site** created on Render
- [ ] Root directory set to `SchoolPortal`
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] Environment variable added: `VITE_API_BASE_URL` (with backend URL)
- [ ] Redirects configured for SPA routing
- [ ] SchoolPortal deployed successfully
- [ ] SchoolPortal URL noted
- [ ] Backend CORS_ORIGINS updated with portal URL

### Post-Deployment
- [ ] Test login from frontend
- [ ] Test API endpoints
- [ ] Verify file uploads work (temporary)
- [ ] Change default admin password
- [ ] Test all major features
- [ ] Monitor logs for errors
- [ ] Test public portal loads correctly
- [ ] Test public portal API calls succeed

---

## Quick Reference

### Render URLs
- **Backend**: `https://schoolwizard-backend.onrender.com`
- **Frontend**: `https://schoolwizard-frontend.onrender.com`
- **Portal**: `https://schoolwizard-portal.onrender.com`

### Database (Hostinger)
- **Host**: ⚠️ **Get from hPanel** - NOT `mysql.hostinger.com` unless that's what hPanel shows!
- **Port**: `3306`
- **Database**: Usually `u[numbers]_schoolwizard` (check hPanel for exact name)
- **Username**: Usually `u[numbers]_schoolwizard_user` (check hPanel for exact username)
- **Password**: (your secure password)

### Default Login
- **Email**: `admin@schoolwizard.com`
- **Password**: `admin123`
- **⚠️ Change immediately after deployment!**

**If login fails with "Invalid credentials":**
- The admin password might not be set correctly in the database
- See [Step 3: Fix Admin Password](#step-3-fix-admin-password-if-getting-invalid-credentials) in this guide
- Or run the SQL query in phpMyAdmin to reset the password

### Environment Variables Summary

**Backend (Render)**:
```
NODE_ENV=production
PORT=10000
DB_HOST=mysql.hostinger.com
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
DB_PORT=3306
JWT_SECRET=your-32-char-secret
JWT_EXPIRE=7d
CORS_ORIGINS=https://schoolwizard-frontend.onrender.com,https://schoolwizard-portal.onrender.com
```

**Frontend (Render)**:
```
VITE_API_BASE_URL=https://schoolwizard-backend.onrender.com/api/v1
```

**SchoolPortal (Render)**:
```
VITE_API_BASE_URL=https://schoolwizard-backend.onrender.com/api/v1
```

---

## Troubleshooting

### 404 Error on Page Refresh / Client-Side Routing Issues

**Error**: `404 Not Found` when refreshing pages like `/library`, `/students`, etc.

**Symptoms**:
- Pages work when navigating via links
- Refreshing the page shows 404 error
- Direct URL access shows 404
- Console shows: `GET /library 404 (Not Found)`

**Root Cause**: When you refresh a client-side route (like `/library`), the browser makes a request to the server for that path. The server doesn't have a file at `/library`, so it returns 404. React Router only works client-side after `index.html` is loaded.

**Solution**: 
- ✅ **Already Fixed**: A `_redirects` file has been created in `frontend/public/_redirects`
- This file tells Render to serve `index.html` for all routes, allowing React Router to handle routing
- The file is automatically included in the build and deployed
- **After deploying**, refresh should work correctly

**If you still see 404 or redirect to `/index.html` after deployment**:

**⚠️ IMPORTANT: Render Static Sites require redirects to be configured in the Dashboard**

The `_redirects` file alone may not work on Render. You **MUST** configure redirects in the Render Dashboard:

**Step 1: Configure Redirects in Render Dashboard (REQUIRED)**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Navigate to your Static Site (e.g., "SchoolWizard")
3. Click on **Settings** (gear icon)
4. Scroll down to find **"Redirects/Rewrites"** section
5. Click **"Add Redirect"** or **"Add Rewrite"**
6. Configure as follows:
   - **Source Path**: `/*` (matches all paths)
   - **Destination Path**: `/index.html`
   - **Status Code**: `200` (NOT 301 or 302 - this is critical!)
   - **Type**: Use "Rewrite" if available (internally serves index.html without changing URL)
     - OR use "Redirect" with status `200` (serves index.html but keeps URL)
7. Click **Save**
8. Render will automatically redeploy
9. Wait for deployment to complete (usually 1-2 minutes)
10. Test by:
    - Navigating to `https://schoolwizard-0bcm.onrender.com/students`
    - Refreshing the page (F5 or Ctrl+R)
    - The URL should stay as `/students` and not redirect to `/index.html`

**Step 2: Verify _redirects File (Backup)**
1. Verify `frontend/public/_redirects` exists with content: `/*    /index.html   200`
2. The file should be automatically copied to `dist/_redirects` during build
3. This serves as a backup, but Render Dashboard configuration takes precedence

**Step 3: Clear Browser Cache**
- After configuring redirects, clear your browser cache or use Incognito/Private mode
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

**Troubleshooting:**
- If redirects are configured but still redirecting to `/index.html`:
  - Check that status code is `200`, not `301` or `302`
  - Verify the source path is `/*` (with asterisk)
  - Wait a few minutes for changes to propagate
  - Try in a different browser or incognito mode
- If you see 404 errors:
  - The redirect might not be configured correctly
  - Check Render deployment logs for errors
  - Verify the Static Site service type (not Web Service)

---

### Blank Page / TypeError: m.map is not a function

**Error**: Page goes blank, console shows `TypeError: Cannot read property 'map' of undefined` or similar

**Symptoms**:
- Page loads but shows blank content
- Console shows errors like `TypeError: Cannot read property 'map' of undefined`
- Sometimes works after refresh, sometimes doesn't
- API calls return 401 or 404 errors

**Root Cause**: 
- API calls are failing (401 Unauthorized, 404 Not Found)
- Components try to map over undefined/null data
- Missing error handling and default values

**Solutions**:
1. **Check API Base URL**:
   - Verify `VITE_API_BASE_URL` is set correctly in Render
   - Should be: `https://your-backend-url.onrender.com/api/v1`
   - No trailing slash

2. **Check Authentication**:
   - Ensure you're logged in
   - Token might be expired - try logging out and back in
   - Check browser console for 401 errors

3. **Check CORS**:
   - Verify `CORS_ORIGINS` in backend matches frontend URL
   - Should include both frontend and portal URLs
   - Format: `url1,url2` (no spaces)

4. **Check Backend Logs**:
   - Render Dashboard → Backend Service → Logs
   - Look for errors or warnings
   - Check if backend is running

---

### CORS Issues

**Error**: `Access to XMLHttpRequest ... has been blocked by CORS policy`

**Symptoms**:
- Console shows CORS errors
- API calls fail with CORS policy errors
- Admin frontend shows "0" for all stats
- Portal shows 401 errors

**Root Causes**:

1. **CORS_ORIGINS Not Configured Correctly**:
   - **Solution**: 
     - Go to Render Dashboard → Backend Service → Environment
     - Ensure `CORS_ORIGINS` includes BOTH frontend and portal URLs
     - Format: `https://frontend-url.onrender.com,https://portal-url.onrender.com`
     - No spaces, no trailing slashes
     - Wait for backend to redeploy

2. **CORS_ORIGIN vs CORS_ORIGINS**:
   - **Solution**: Use `CORS_ORIGINS` (plural) for multiple origins
   - Delete `CORS_ORIGIN` if it exists
   - Create/update `CORS_ORIGINS` with comma-separated URLs

3. **URL Mismatch**:
   - **Solution**: 
     - Verify URLs match exactly (case-sensitive)
     - Check for trailing slashes
     - Ensure using `https://` not `http://`

4. **Backend Not Redeployed After CORS Change**:
   - **Solution**: 
     - Wait 1-2 minutes after updating CORS_ORIGINS
     - Check backend logs to confirm redeployment
     - Clear browser cache and try again

**Quick Fix**:
1. Update `CORS_ORIGINS` in Render Dashboard
2. Wait for backend redeployment
3. Clear browser cache
4. Test in incognito window

---

### Admin Password Reset

**Error**: "Invalid credentials" when trying to login

**Solution**: Reset admin password using SQL:

1. **Access phpMyAdmin**:
   - Hostinger hPanel → Databases → phpMyAdmin
   - Select your database

2. **Run SQL Query**:
   ```sql
   USE your_database_name;

   -- Update admin password to 'admin123'
   UPDATE users
   SET password = '$2a$10$LO7O/f4lNC5tHZf1yr1ObuiD/r8PiQN9SQZ22rXSLicXXoo/oB1Ca',
       is_active = 1,
       role_id = 1
   WHERE email = 'admin@schoolwizard.com';

   -- Verify
   SELECT id, email, name, role_id, is_active FROM users WHERE email = 'admin@schoolwizard.com';
   ```

3. **Test Login**:
   - Email: `admin@schoolwizard.com`
   - Password: `admin123`

---

## Custom Domain Setup (Optional)

### Backend Custom Domain

1. **In Render Dashboard**:
   - Go to your Backend Service → **Settings** → **Custom Domains**
   - Click **"Add Custom Domain"**
   - Enter your domain: `api.yourschool.com`
   - Follow DNS configuration instructions

2. **Update DNS Records**:
   - Add CNAME record pointing to Render's provided hostname
   - Wait for DNS propagation (can take up to 48 hours)

3. **Update Environment Variables**:
   - Update `CORS_ORIGINS` to include new domain
   - Update frontend `VITE_API_BASE_URL` if needed

### Frontend Custom Domain

1. **In Render Dashboard**:
   - Go to your Frontend Static Site → **Settings** → **Custom Domains**
   - Click **"Add Custom Domain"**
   - Enter your domain: `admin.yourschool.com` or `app.yourschool.com`
   - Follow DNS configuration instructions

2. **Update DNS Records**:
   - Add CNAME record pointing to Render's provided hostname
   - Wait for DNS propagation

3. **Update Backend CORS**:
   - Add new frontend domain to `CORS_ORIGINS`

### Portal Custom Domain

1. **In Render Dashboard**:
   - Go to your Portal Static Site → **Settings** → **Custom Domains**
   - Click **"Add Custom Domain"**
   - Enter your domain: `www.yourschool.com` or `yourschool.com`
   - Follow DNS configuration instructions

2. **Update DNS Records**:
   - Add CNAME record pointing to Render's provided hostname
   - Wait for DNS propagation

3. **Update Backend CORS**:
   - Add new portal domain to `CORS_ORIGINS`

---

## Additional Tips & Best Practices

### Security

1. **Change Default Passwords**:
   - Change admin password immediately after deployment
   - Use strong, unique passwords

2. **Environment Variables**:
   - Never commit `.env` files to Git
   - Use Render's environment variable management
   - Rotate JWT_SECRET periodically

3. **Database Security**:
   - Use strong database passwords
   - Limit Remote MySQL access to Render IPs if possible
   - Regularly backup database

4. **CORS Configuration**:
   - Only allow specific origins (not `*`)
   - Keep CORS_ORIGINS updated with all frontend URLs

### Performance

1. **Database Optimization**:
   - Regularly optimize database tables
   - Monitor query performance
   - Add indexes for frequently queried columns

2. **File Uploads**:
   - Current setup uses Render's ephemeral filesystem
   - Files are lost on redeployment
   - Consider migrating to cloud storage (S3, Cloudinary) for production

3. **Caching**:
   - Implement caching for frequently accessed data
   - Use CDN for static assets (Render provides this automatically)

### Monitoring

1. **Backend Logs**:
   - Regularly check Render backend logs
   - Monitor for errors or warnings
   - Set up alerts for critical errors

2. **Database Monitoring**:
   - Monitor database connection health
   - Check for slow queries
   - Monitor database size

3. **Frontend Monitoring**:
   - Monitor build times
   - Check for build errors
   - Verify deployments succeed

### Backup & Recovery

1. **Database Backups**:
   - Use Hostinger's backup feature
   - Or implement automated backups via backend
   - Store backups securely

2. **Code Backups**:
   - All code is in GitHub (version control)
   - Tag releases for easy rollback
   - Keep deployment documentation updated

### Maintenance

1. **Regular Updates**:
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging before production

2. **Database Maintenance**:
   - Regularly clean up old data
   - Optimize tables
   - Monitor database size

3. **File Cleanup**:
   - Remove unused uploaded files
   - Implement file retention policies
   - Monitor storage usage

---

**Last Updated**: January 2025
