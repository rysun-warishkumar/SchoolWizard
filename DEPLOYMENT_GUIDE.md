# SchoolWizard - Deployment Guide for Render + Hostinger MySQL

Complete guide to deploy SchoolWizard on Render (Backend & Frontend) with Hostinger MySQL database.

## 🚀 Quick Start Summary

**Estimated Time**: 30-45 minutes

1. **Database** (5 min): Create MySQL database on Hostinger, import schema
2. **Backend** (10 min): Deploy backend service on Render, configure environment variables
3. **Frontend** (10 min): Deploy frontend static site on Render, configure API URL
4. **Testing** (10 min): Test login, verify connections, update CORS

**Total Cost**: 
- Render: Free tier available (services spin down after 15 min inactivity)
- Hostinger: Depends on your hosting plan (usually includes MySQL)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Hostinger MySQL)](#database-setup-hostinger-mysql)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Render)](#frontend-deployment-render)
5. [Public School Portal Deployment (Render)](#public-school-portal-deployment-render) ⭐ NEW
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
   - Click **Create**
4. **Create Database User**:
   - Username: Create a new user (e.g., `schoolwizard_user`)
   - Password: Generate a strong password (save it securely!)
   - Click **Create User**
5. **Assign User to Database**:
   - Select the user and database
   - Grant **ALL PRIVILEGES**
   - Click **Add**

### Step 2: Get Database Connection Details

From Hostinger hPanel, note down:
- **Database Host**: Usually `localhost` or `mysql.hostinger.com` (check your hPanel)
- **Database Name**: `schoolwizard` (or your chosen name)
- **Database Username**: `schoolwizard_user` (or your chosen username)
- **Database Password**: The password you created
- **Database Port**: Usually `3306`

**Important**: Some Hostinger plans use remote MySQL. Check if you need to:
- Enable **Remote MySQL** access in hPanel
- Add your Render server IP to allowed hosts

**Finding Your Render Server IP**:
1. After deploying backend on Render, go to Render Dashboard → Your Backend Service → Settings
2. Look for **Outbound IP** or **Static IP** (if available)
3. Some Render plans provide static IPs, free tier uses dynamic IPs
4. **Alternative**: Use `%` wildcard in Hostinger Remote MySQL (less secure, but works for dynamic IPs)
   - ⚠️ Only use `%` if you have strong database passwords and proper security measures

### Step 3: Import Database Schema

#### Option A: Using phpMyAdmin (Easiest - Recommended)

1. **Access phpMyAdmin** from Hostinger hPanel
   - Go to **Databases** → **phpMyAdmin**
   - Or find phpMyAdmin link in your hosting control panel
2. **Select your database** (`schoolwizard`) from left sidebar
3. **Click "Import" tab** (top menu)
4. **Choose File**: 
   - Click **Choose File** button
   - Navigate to `database/consolidated/00_complete_database.sql` on your local machine
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
2. **Click "New +"** → **"Web Service"**
3. **Connect Repository**:
   - Connect your GitHub account
   - Select the `SchoolWizard` repository
   - Choose branch (usually `main` or `master`)
4. **Configure Service**:
   - **Name**: `schoolwizard-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Environment Variables** (Add these in Render dashboard):
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=your_actual_hostname_from_hostinger_hpanel
   DB_USER=your_database_username
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   DB_PORT=3306
   JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
   JWT_EXPIRE=7d
   CORS_ORIGIN=https://schoolwizard-frontend.onrender.com
   ```
   **⚠️ CRITICAL Notes**:
   - **`DB_HOST`**: ⚠️ **MUST be the exact hostname from your Hostinger hPanel** - NOT `mysql.hostinger.com` unless that's what your hPanel shows!
   - **`DB_NAME`**: Usually starts with `u` followed by numbers (e.g., `u524544702_schoolwizard`)
   - **`DB_USER`**: Usually starts with `u` followed by numbers (e.g., `u524544702_schoolwizard_user`)
   - `JWT_SECRET` must be at least 32 characters long
   - `CORS_ORIGIN` should be your frontend URL (update after frontend deployment)
   - Replace all placeholder values with your actual credentials from Hostinger hPanel
6. **Advanced Settings**:
   - **Auto-Deploy**: `Yes` (deploys on every push to selected branch)
   - **Health Check Path**: `/health` (backend already has this endpoint)
   - **Pull Request Previews**: `No` (optional, for testing PRs)
7. **Click "Create Web Service"**
8. **Wait for Build**: 
   - Render will start building your backend
   - This may take 3-5 minutes
   - Watch the build logs for any errors
   - Build process:
     1. Clones repository
     2. Runs `npm install`
     3. Runs `npm run build` (TypeScript compilation)
     4. Runs `node scripts/fix-imports.js` (fixes ES module imports)
     5. Starts service with `npm start`
9. **Note the URL**: 
   - After successful deployment, you'll see: `https://schoolwizard-backend.onrender.com`
   - Save this URL - you'll need it for frontend configuration
10. **Check Deployment Status**:
    - Green indicator = Service is live
    - Yellow indicator = Building or deploying
    - Red indicator = Deployment failed (check logs)

### Step 3: Configure File Uploads

**⚠️ Important**: Render's filesystem is **ephemeral** (files are lost on restart or redeploy).

**Current Setup**:
- Files are stored in `backend/uploads/` directory
- Files will work temporarily but will be lost on:
  - Service restart
  - Code deployment
  - Service spin-down (free tier)

**For Production (Recommended Solutions)**:

**Option A: Use Cloud Storage (Best Practice)**
- **AWS S3**: Reliable, scalable, pay-per-use
- **Cloudinary**: Great for images, includes transformations
- **Google Cloud Storage**: Alternative to S3
- **DigitalOcean Spaces**: S3-compatible, simpler pricing

**Option B: Use Render Disk (Paid Feature)**
- Add persistent disk in Render dashboard
- Update upload path to use disk storage
- Files persist across deployments

**For Initial Deployment**:
- Current setup will work for testing
- Files uploaded will be accessible until next deployment
- **Plan to migrate to cloud storage before production use**

**Creating Uploads Directory Structure**:

The backend automatically creates upload directories, but for Render deployment, ensure the structure exists:

```bash
backend/uploads/
├── students/
├── staff/
├── documents/
└── (other upload folders as needed)
```

**Note**: These directories will be created automatically on first upload, but you can pre-create them in your repository or they'll be created at runtime.

---

## Frontend Deployment (Render)

### Step 1: Prepare Frontend for Production

1. **Update `frontend/vite.config.ts`** (if needed):
   ```typescript
   export default defineConfig({
     plugins: [react()],
     build: {
       outDir: 'dist',
       sourcemap: false,
     },
     server: {
       port: 5173,
     },
   })
   ```

2. **Create `frontend/render.yaml`** (optional):
   ```yaml
   services:
     - type: web
       name: schoolwizard-frontend
       env: static
       buildCommand: npm install && npm run build
       staticPublishPath: ./dist
       envVars:
         - key: VITE_API_BASE_URL
           value: https://schoolwizard-backend.onrender.com/api/v1
   ```

### Step 2: Deploy Frontend on Render

⚠️ **CRITICAL**: You **MUST** create a **Static Site**, NOT a Web Service! If you created it as a Web Service, delete it and create a Static Site instead.

1. **In Render Dashboard**, click **"New +"** → **"Static Site"** (NOT "Web Service")
   - ⚠️ If you see "Web Service" selected, you're in the wrong place!
   - Look for "Static Site" option in the dropdown
2. **Connect Repository**:
   - Select the same `SchoolWizard` repository
   - Choose branch (same as backend, usually `main`)
3. **Configure Site**:
   - **Name**: `SchoolWizard` (or `schoolwizard-frontend`)
   - **Root Directory**: `frontend` ⚠️ **CRITICAL**: Must specify this!
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist` ⚠️ **CRITICAL**: This is where Vite outputs built files
   - **⚠️ IMPORTANT**: The `_redirects` file in `frontend/public/` will be automatically included in the build to handle client-side routing (prevents 404 on page refresh)
4. **Environment Variables**:
   - Click **"Add Environment Variable"**
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://schoolwizard-backend.onrender.com/api/v1`
   - **Important**: 
     - Replace with your actual backend URL from backend deployment
     - Must include `/api/v1` at the end
     - No trailing slash
5. **Advanced Settings**:
   - **Auto-Deploy**: `Yes`
   - **Pull Request Previews**: `No` (optional)
6. **Click "Create Static Site"**
7. **Wait for Build**:
   - Build process:
     1. Clones repository
     2. Runs `npm install`
     3. Runs `npm run build` (creates `dist/` folder)
     4. Deploys `dist/` folder as static site
   - Build may take 2-4 minutes
8. **Note the URL**: 
   - After successful deployment: `https://schoolwizard.onrender.com` (or your service name)
   - This is your frontend URL
9. **Update Backend CORS**:
   - Go back to Backend Service → Environment
   - Update `CORS_ORIGIN` to: `https://schoolwizard.onrender.com` (or your frontend URL)
   - Render will automatically redeploy backend

### ⚠️ If You Already Created It as a Web Service (Error Fix)

If you see this error:
```
Error: Cannot find module '/opt/render/project/src/frontend/index.js'
```

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
CORS_ORIGIN=https://schoolwizard-frontend.onrender.com
# OR use CORS_ORIGINS for multiple origins (comma-separated):
# CORS_ORIGINS=https://schoolwizard-frontend.onrender.com,https://www.yourdomain.com
```

**Generate JWT_SECRET**:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use online generator: https://randomkeygen.com/
```

### Frontend Environment Variables (Render)

Add these in Render Dashboard → Your Frontend Service → Environment:

```env
VITE_API_BASE_URL=https://schoolwizard-backend.onrender.com/api/v1
```

**Important**: Replace with your actual backend URL!

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
   - Should see successful calls to `/api/public/website/...`
   - If errors, verify `VITE_API_BASE_URL` is correct

### Step 4: Update Backend CORS (REQUIRED)

**⚠️ IMPORTANT**: You MUST add the SchoolPortal URL to backend CORS configuration, otherwise the portal won't be able to fetch data from the backend.

1. **Update Backend CORS_ORIGINS**:
   - Go to Render Dashboard → Your Backend Service → **Environment** tab
   - Find `CORS_ORIGINS` environment variable (or create it if it doesn't exist)
   - Update to include both frontend and portal URLs (comma-separated, no spaces):
     ```
     CORS_ORIGINS=https://schoolwizard-frontend.onrender.com,https://schoolwizard-portal.onrender.com
     ```
   - **OR** if you only have `CORS_ORIGIN` (singular), change it to `CORS_ORIGINS` (plural) with both URLs
   - **Important**: 
     - Use `https://` (not `http://`)
     - No trailing slashes
     - No spaces after commas
     - Replace with your actual URLs

2. **Save and Wait**:
   - Click **Save Changes**
   - Render will automatically redeploy the backend (takes 1-2 minutes)
   - Monitor the logs to ensure deployment succeeds

3. **Verify CORS is Working**:
   - After backend redeploys, refresh the SchoolPortal website
   - Open browser console (F12)
   - Check Network tab - API calls should succeed (200 status)
   - No more CORS errors should appear

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

**Issue: API Calls Failing**
- **Solution**: Verify `VITE_API_BASE_URL` environment variable
- Check backend CORS settings include SchoolPortal URL
- Check browser console for CORS errors

**Issue: Content Not Loading**
- **Solution**: 
  - Verify backend is running and accessible
  - Check that public API endpoints are working: `/api/public/website/website-settings`
  - Ensure content is configured in admin panel

**Issue: Build Fails**
- **Solution**:
  - Check build logs in Render Dashboard
  - Verify `Root Directory` is set to `SchoolPortal`
  - Ensure `package.json` exists in SchoolPortal folder
  - Check for TypeScript/compilation errors

---

## Post-Deployment Configuration

### Step 1: Update Backend CORS

The CORS configuration is already handled via environment variables. Just ensure:

1. **Set `CORS_ORIGIN` environment variable** in Render:
   ```
   CORS_ORIGIN=https://schoolwizard-frontend.onrender.com
   ```

2. **For multiple origins**, use `CORS_ORIGINS` (comma-separated):
   ```
   CORS_ORIGINS=https://schoolwizard-frontend.onrender.com,https://www.yourdomain.com
   ```

3. **The backend code automatically handles this** - no code changes needed!

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

   **Expected Response** (Success):
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

   **If Login Fails with "Invalid credentials"**:
   - ⚠️ **Most Common Issue**: Admin password hash in database doesn't match `admin123`
   - **Solution**: Run the SQL query in Step 3 above to reset the password
   - Check backend logs for specific error
   - Verify database connection is working
   - Ensure admin user exists in database: `SELECT * FROM users WHERE email = 'admin@schoolwizard.com';`
   - Check JWT_SECRET is set correctly

### Step 4: Update Frontend API URL

1. **Verify Frontend Environment Variable**:
   - Render Dashboard → Frontend Service → Environment
   - Ensure `VITE_API_BASE_URL` is correct

2. **Rebuild Frontend** (if needed):
   - Render will auto-rebuild on environment variable changes
   - Or manually trigger rebuild

### Step 5: Verify File Uploads Directory

The backend automatically creates upload directories, but verify they work:

1. **Test File Upload**:
   - Login to admin panel
   - Try uploading a student photo
   - Check if file is accessible via URL

2. **Current Behavior**:
   - Files upload successfully
   - Files are accessible via `/uploads/...` URLs
   - **⚠️ Files will be lost on next deployment or restart**

3. **For Production** (Plan for later):
   - Migrate to cloud storage (AWS S3, Cloudinary, etc.)
   - Update multer configuration
   - Update file serving logic

### Step 6: Configure Health Check (Optional but Recommended)

The backend already has a health check endpoint at `/health`. Configure it in Render:

1. **Update Render Health Check**:
   - Render Dashboard → Backend Service → Settings
   - Scroll to **Health Check Path**
   - Enter: `/health`
   - Render will ping this endpoint every few minutes to monitor service health
   - If health check fails, Render will attempt to restart the service

2. **Test Health Endpoint**:
   - Visit: `https://schoolwizard-backend.onrender.com/health`
   - Should return: `{ "status": "ok" }` or similar
   - If database is connected, should show database status

**Note**: Health check helps Render detect service issues and automatically restart if needed.

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

**Error**: Page goes blank, console shows `TypeError: m.map is not a function` or similar

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
   - Verify `CORS_ORIGIN` in backend matches frontend URL
   - See [CORS Issues](#cors-issues-most-common-frontend-issue) section

4. **Add Error Handling** (Code-level fix):
   - Components should check if data exists before mapping
   - Use optional chaining: `data?.map(...)` or `(data || []).map(...)`
   - Add loading states and error boundaries

**Quick Fix**: Clear browser cache, log out, log back in, and try again.

---

### Database Connection Issues

**Error**: `ECONNREFUSED`, `ETIMEDOUT`, or `getaddrinfo ENOTFOUND`

**Solutions**:
1. **Check Database Host** (Most Common Issue):
   - ⚠️ **The hostname `mysql.hostinger.com` is often WRONG!**
   - **You MUST get the exact hostname from your Hostinger hPanel**:
     1. Login to Hostinger hPanel
     2. Go to **Databases** → **MySQL Databases**
     3. Find your database and click on it
     4. Look for **"Host"** or **"Server"** field
     5. Copy that **exact** hostname (it might be different!)
   - Common actual hostnames:
     - `mysql.hostinger.in` (India)
     - `mysql.hostinger.co.uk` (UK)
     - `mysql.hostinger.nl` (Netherlands)
     - `mysql123.hostinger.com` (varies by account)
     - Or a specific IP address
   - **Update `DB_HOST` in Render** with the correct hostname from hPanel
   - Some Hostinger plans use `localhost` (only works from same server - won't work from Render)

2. **Enable Remote MySQL**:
   - Hostinger hPanel → Databases → **Remote MySQL**
   - **Option A (More Secure)**: Add specific Render IPs
     - Get Render static IP (if available) from Render Dashboard → Settings
     - Add IP to Remote MySQL allowed hosts
   - **Option B (Easier, Less Secure)**: Use wildcard
     - Add `%` to allowed hosts (allows all IPs)
     - ⚠️ Only use if you have strong database password
     - Recommended for initial testing, then restrict to specific IPs
   - **Wait 5-10 minutes** after adding IPs for changes to take effect

3. **Check Firewall**:
   - Ensure MySQL port (3306) is open
   - Some Hostinger plans restrict remote access

4. **Verify Credentials**:
   - Double-check username, password, database name
   - Test connection using MySQL client or phpMyAdmin

### Backend Build Failures

**Error**: TypeScript compilation errors

**Solutions**:
1. **Check Build Logs** in Render Dashboard
2. **Fix TypeScript Errors** locally first:
   ```bash
   cd backend
   npm run build
   ```
3. **Commit and Push** fixes to trigger new build

**Error**: `ERR_MODULE_NOT_FOUND`

**Solutions**:
1. **Ensure `fix-imports.js` runs** in build command
2. **Check `backend/scripts/fix-imports.js`** exists
3. **Verify build command**: `npm install && npm run build`
4. **Check build logs** for import errors
5. **Common issue**: Missing `.js` extensions in compiled code
   - The `fix-imports.js` script should handle this
   - If it doesn't, manually check `dist/index.js` for import statements

**Error**: Service crashes on start

**Solutions**:
1. **Check logs** for specific error messages
2. **Common causes**:
   - Missing environment variables (especially `JWT_SECRET`)
   - Database connection failure
   - Port already in use (unlikely on Render)
3. **Verify all required environment variables** are set
4. **Check database connection** is working

### Frontend Build Failures

**Error**: Environment variable not found

**Solutions**:
1. **Check Environment Variables** in Render Dashboard
2. **Ensure `VITE_` prefix** for Vite variables
3. **Rebuild** after adding variables

**Error**: API calls failing

**Solutions**:
1. **Check CORS** configuration in backend
   - Verify `CORS_ORIGIN` matches frontend URL exactly
   - Check backend logs for CORS errors
   - Test API directly (bypasses CORS): `curl https://backend-url/api/v1/...`

2. **Verify `VITE_API_BASE_URL`** is correct
   - Must include `/api/v1` at the end
   - Must use `https://` (not `http://`)
   - No trailing slash

3. **Check browser console** for specific errors
   - Network tab shows failed requests
   - Console shows CORS or other errors

4. **Test API directly** using Postman or curl
   - If API works in Postman but not in browser → CORS issue
   - If API doesn't work in Postman → Backend issue

5. **Common CORS Issues**:
   - Frontend URL doesn't match `CORS_ORIGIN` exactly
   - Missing `https://` or extra trailing slash
   - Backend not restarted after CORS_ORIGIN change

### Performance Issues

**Slow Response Times**:

1. **Render Free Tier Limitations**:
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes 30-60 seconds (cold start)
   - Subsequent requests are fast
   - **Solution**: 
     - Upgrade to paid plan ($7/month) for always-on service
     - Or use a service like UptimeRobot to ping your backend every 10 minutes (keeps it awake)

2. **Database Connection Issues**:
   - Remote database connections can be slower
   - Check database connection pool settings in `backend/src/config/database.ts`
   - Optimize query performance
   - Consider database location (Hostinger server location vs Render server location)

3. **Enable Caching**:
   - Implement response caching where appropriate
   - Use CDN for static assets (Render provides CDN for static sites)
   - Cache frequently accessed data

4. **Frontend Performance**:
   - Static site on Render is served via CDN (fast)
   - Large bundle sizes can slow initial load
   - Consider code splitting and lazy loading

---

## Custom Domain Setup (Optional)

### Backend Custom Domain

1. **Render Dashboard** → Your Backend Service → Settings
2. **Custom Domain** section
3. **Add Domain**: `api.yourdomain.com`
4. **Update DNS**:
   - Add CNAME record: `api` → `schoolwizard-backend.onrender.com`
5. **Update Environment Variables**:
   - Update `CORS_ORIGIN` to include new domain

### Frontend Custom Domain

1. **Render Dashboard** → Your Frontend Service → Settings
2. **Custom Domain** section
3. **Add Domain**: `yourdomain.com` or `www.yourdomain.com`
4. **Update DNS**:
   - Add CNAME record: `@` or `www` → `schoolwizard-frontend.onrender.com`
5. **Update Frontend Environment**:
   - Update `VITE_API_BASE_URL` if backend also has custom domain

---

## Security Checklist

- [ ] Change default admin password after first login
- [ ] Use strong `JWT_SECRET` (minimum 32 characters)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Configure CORS properly
- [ ] Use environment variables for all secrets
- [ ] Enable database SSL (if Hostinger supports it)
- [ ] Regular database backups
- [ ] Monitor Render logs for errors
- [ ] Keep dependencies updated
- [ ] Use strong database passwords

---

## Monitoring & Maintenance

### Regular Tasks

1. **Monitor Logs**:
   - Check Render Dashboard logs regularly
   - Set up error alerts if available

2. **Database Backups**:
   - Use Hostinger backup feature
   - Or export via phpMyAdmin regularly

3. **Update Dependencies**:
   ```bash
   # Backend
   cd backend
   npm update

   # Frontend
   cd frontend
   npm update
   ```

4. **Check Render Status**:
   - Monitor service health
   - Check for Render maintenance windows

---

## Deployment Checklist

Use this checklist to ensure all steps are completed:

### Pre-Deployment
- [ ] Hostinger MySQL database created
- [ ] Database user created with ALL PRIVILEGES
- [ ] Database schema imported successfully
- [ ] Remote MySQL enabled (if needed)
- [ ] Render account created
- [ ] GitHub repository ready
- [ ] JWT_SECRET generated (32+ characters)

### Backend Deployment
- [ ] Repository connected to Render
- [ ] Backend service created on Render
- [ ] Root directory set to `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] All environment variables added:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `DB_HOST` (correct Hostinger host)
  - [ ] `DB_USER` (database username)
  - [ ] `DB_PASSWORD` (database password)
  - [ ] `DB_NAME` (database name)
  - [ ] `DB_PORT=3306`
  - [ ] `JWT_SECRET` (32+ characters)
  - [ ] `JWT_EXPIRE=7d`
  - [ ] `CORS_ORIGIN` (frontend URL - update after frontend deploy)
- [ ] Backend deployed successfully
- [ ] Backend URL noted
- [ ] Database connection verified in logs

### Frontend Deployment
- [ ] Frontend **Static Site** created on Render (NOT Web Service!)
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] Environment variable added: `VITE_API_BASE_URL` (with backend URL)
- [ ] Frontend deployed successfully (no "Cannot find module index.js" error)
- [ ] Frontend URL noted
- [ ] Backend CORS_ORIGIN updated with frontend URL

### Post-Deployment
- [ ] Test login from frontend
- [ ] Test API endpoints
- [ ] Verify file uploads work (temporary)
- [ ] Change default admin password
- [ ] Test all major features
- [ ] Monitor logs for errors

---

## Quick Reference

### Render URLs
- **Backend**: `https://schoolwizard-backend.onrender.com`
- **Frontend**: `https://schoolwizard-frontend.onrender.com`

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
CORS_ORIGIN=https://schoolwizard-frontend.onrender.com
```

**Frontend (Render)**:
```
VITE_API_BASE_URL=https://schoolwizard-backend.onrender.com/api/v1
```

---

## Additional Tips & Best Practices

### Keeping Free Tier Services Awake

Render free tier services spin down after 15 minutes. To keep them awake:

**Option 1: UptimeRobot (Free)**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor for your backend URL
3. Set interval to 5 minutes
4. Service will ping your backend, keeping it awake

**Option 2: Cron Job**
- Set up a cron job on any server to ping your backend
- Use services like [cron-job.org](https://cron-job.org) (free)

**Option 3: Upgrade to Paid**
- Render paid plans ($7/month) keep services always-on
- No cold starts, better performance

### Database Connection String Format

If you need to use a connection string instead of separate variables:

```
mysql://username:password@host:port/database
```

Example:
```
mysql://schoolwizard_user:password123@mysql.hostinger.com:3306/schoolwizard
```

**Note**: Current setup uses separate environment variables, which is more secure and flexible.

### Monitoring Your Deployment

1. **Render Dashboard**:
   - Monitor service health
   - View real-time logs
   - Check deployment history
   - Set up email alerts (if available)

2. **Database Monitoring**:
   - Use Hostinger phpMyAdmin to monitor database
   - Check table sizes and query performance
   - Regular backups via Hostinger or phpMyAdmin export

3. **Application Monitoring**:
   - Add logging for important operations
   - Monitor error rates in Render logs
   - Track API response times

### Scaling Considerations

**Current Setup** (Free Tier):
- Backend: 1 instance, spins down after inactivity
- Frontend: Static site, unlimited traffic
- Database: Hostinger MySQL (check your plan limits)

**For Growth**:
- Upgrade Render backend to paid plan for always-on
- Consider database connection pooling optimization
- Implement caching layer (Redis, etc.)
- Use CDN for static assets
- Monitor database performance and optimize queries

---

## Support Resources

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Hostinger MySQL Guide**: Check Hostinger knowledge base
- **Hostinger Support**: Available in hPanel
- **Project README**: [README.md](README.md)
- **Portal Guide**: [PortalGuide.md](PortalGuide.md)

---

## Common Render URLs Pattern

After deployment, your URLs will follow this pattern:
- **Backend**: `https://[service-name].onrender.com`
- **Frontend**: `https://[service-name].onrender.com`

Example:
- Backend: `https://schoolwizard-backend.onrender.com`
- Frontend: `https://schoolwizard-frontend.onrender.com`

You can customize service names when creating services in Render.

---

## Step-by-Step Deployment Flow

### Phase 1: Database Preparation (5-10 minutes)
1. ✅ Create database on Hostinger
2. ✅ Create database user
3. ✅ Assign user to database
4. ✅ Import database schema via phpMyAdmin
5. ✅ Verify tables are created
6. ✅ Note database connection details

### Phase 2: Backend Deployment (10-15 minutes)
1. ✅ Connect GitHub repository to Render
2. ✅ Create Web Service for backend
3. ✅ Configure build and start commands
4. ✅ Add all environment variables
5. ✅ Deploy and wait for build
6. ✅ Check logs for database connection
7. ✅ Test health endpoint
8. ✅ Note backend URL

### Phase 3: Frontend Deployment (10-15 minutes)
1. ✅ Create **Static Site** on Render (NOT Web Service!)
2. ✅ Set Root Directory to `frontend`
3. ✅ Set Publish Directory to `dist`
4. ✅ Configure build command: `npm install && npm run build`
5. ✅ Add environment variable: `VITE_API_BASE_URL` (with backend URL)
6. ✅ Deploy and wait for build
7. ✅ Verify no "Cannot find module index.js" error
8. ✅ Note frontend URL
9. ✅ Update backend CORS_ORIGIN

### Phase 4: Verification (5-10 minutes)
1. ✅ Test login from frontend
2. ✅ Verify API calls work
3. ✅ Test file uploads (temporary)
4. ✅ Change default admin password
5. ✅ Test major features

---

## Important Notes

### ⚠️ Render Free Tier Limitations

1. **Service Spin-Down**:
   - Services automatically spin down after 15 minutes of inactivity
   - First request after spin-down takes 30-60 seconds (cold start)
   - Subsequent requests are fast
   - **Solution**: Use UptimeRobot or similar to ping service every 10 minutes

2. **Ephemeral Filesystem**:
   - Files uploaded to `backend/uploads/` are lost on:
     - Service restart
     - Code deployment
     - Service spin-down
   - **Solution**: Migrate to cloud storage (AWS S3, Cloudinary) for production

3. **Build Time Limits**:
   - Free tier has build time limits
   - Large builds may timeout
   - **Solution**: Optimize build or upgrade to paid plan

### 🔒 Security Reminders

- **Change default admin password** immediately after deployment
- **Use strong JWT_SECRET** (32+ characters, random)
- **Use strong database passwords**
- **Enable HTTPS** (automatic on Render)
- **Configure CORS properly** (only allow your frontend domain)
- **Regular backups** of database

### 📊 Monitoring

- **Render Dashboard**: Monitor service health and logs
- **Hostinger phpMyAdmin**: Monitor database
- **Set up alerts**: Configure email alerts in Render (if available)
- **Regular checks**: Review logs weekly for errors

---

**Last Updated**: December 2024
