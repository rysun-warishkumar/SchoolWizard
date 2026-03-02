# School Registration, Trial & Platform Admin – Approach and Plan

This document outlines the approach and implementation plan for:
1. **School self-registration** (any user can register as school admin)
2. **30-day trial** with upgrade-by-contact after expiry
3. **Backend / Platform Admin panel** to track and manage schools and trials
4. **Custom domain** support (design so schools can configure their own domain later)

**Status:** Plan for your review. Development will start only after your confirmation.

---

## Confirmed Choices (as of latest review)

| Item | Decision |
|------|----------|
| **Trial length** | 30 days |
| **Email configuration** | **Default:** Same email (SMTP) configuration for all schools. **When a school has a custom domain configured:** that school can have its own email configuration (e.g. send from `noreply@theirschool.com`). Email **templates** will be updated so each school’s emails use that school’s name/branding (school-specific content). |
| **Platform Admin** | Inside the **same React app** at route **`/platform`**. Only visible and accessible to platform superadmin (school_id IS NULL). |
| **Custom domain** | Part A only in first release (store + configure in DB and Platform Admin). Part B (Host-based resolution, DNS/SSL) in a later phase—chosen for low complexity, low risk, easy implementation. |

---

## 1. Current State vs Target

| Aspect            | Current                                   | Target                                                                |
|--------           |--------                                   |--------                                           |
| Tenancy           | Single-tenant (one school per deployment) | Multi-tenant (many schools, one app + one DB) |
| School entity     | Not in DB                                 | `schools` table; all tenant data scoped by `school_id` |
| Admin creation    | Manual (SQL or you create user)           | Self-service: public **Register your school** flow |
| Access control    | Role-based only                           | Role + **school_id** (user sees only their school’s data) |
| Billing / trial   | None                                      | 30-day trial; after expiry, “Contact us to upgrade” (no payment gateway in v1) |
| Your control      | N/A                                       | **Platform Admin** panel to list schools, manage trial, set custom domain |

---

## 2. High-Level Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    PUBLIC (no login)                      │
                    │  • Landing / Marketing page                              │
                    │  • Register your school (school name, admin name,       │
                    │    email, password) → creates school + admin user        │
                    │  • Login page (existing, but post-login scoped by school)│
                    └─────────────────────────────────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │              BACKEND API (Node/Express)                   │
                    │  • Auth: login returns JWT + school_id + trial info      │
                    │  • All tenant APIs: filter by req.user.school_id         │
                    │  • Trial middleware: if trial_ended → 403 / upgrade msg │
                    │  • Platform Admin APIs: /api/platform/* (superadmin only)│
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │              DATABASE (MySQL – single DB)                 │
                    │  • schools (id, name, slug, status, trial_ends_at,        │
                    │            custom_domain, created_at, ...)               │
                    │  • users.school_id (nullable for platform superadmin)    │
                    │  • All tenant tables: school_id (e.g. students, classes) │
                    └─────────────────────────────────────────────────────────┘
                    ┌─────────────────────────────────────────────────────────┐
                    │           ADMIN FRONTEND (React – existing)              │
                    │  • After login: all data scoped to user’s school_id      │
                    │  • Trial banner / expiry page: “Contact us to upgrade”   │
                    └─────────────────────────────────────────────────────────┘
                    ┌─────────────────────────────────────────────────────────┐
                    │         PLATFORM ADMIN (same app, route /platform)       │
                    │  • List schools, search, filter by status/trial          │
                    │  • Extend trial, set status (trial | active | expired)   │
                    │  • Edit school (name, custom domain), view basic stats   │
                    └─────────────────────────────────────────────────────────┘
```

---

## 3. Data Model Changes

### 3.1 New table: `schools`

| Column | Type | Purpose |
|--------|------|--------|
| id | INT PK | |
| name | VARCHAR(255) | School display name |
| slug | VARCHAR(100) UNIQUE | URL-friendly (e.g. `abc-school`); used in subdomain or paths |
| status | ENUM('trial','active','expired','suspended') | trial = in trial; active = paid/upgraded; expired = trial ended; suspended = disabled by you |
| trial_starts_at | TIMESTAMP | When trial started (registration time) |
| trial_ends_at | TIMESTAMP | Trial end; after this, access restricted until status = 'active' |
| custom_domain | VARCHAR(255) NULL | Optional; e.g. `school.example.com` (configured later) |
| created_at, updated_at | TIMESTAMP | |

Optional for v1: `plan_code`, `storage_limit_bytes`, `contact_email`, `contact_phone` for future use.

### 3.2 Change: `users`

- Add **school_id INT NULL** (FK → schools.id).
  - **NULL** = platform superadmin (can access Platform Admin only).
  - Non-NULL = user belongs to that school; all data scoped by this.
- Unique constraint: **(email, school_id)** or keep **email** unique globally (recommended: **email** unique so one email cannot be admin of two schools with same login; alternatively one email per school if you allow same person to run multiple schools).

Recommendation: **email UNIQUE globally**; one user can have one school_id. So one person can only be admin of one school with that email. Simpler and avoids cross-school login confusion.

### 3.3 Tenant-scoped tables (add `school_id`)

Every table that holds “per-school” data gets **school_id INT NOT NULL** (FK → schools.id), e.g.:

- classes, sections, class_sections  
- students, staff (HR), subjects, subject_groups  
- sessions (academic year), timetable, attendance  
- fees, income, expenses  
- general_settings, front_cms_website_settings, email_settings  
- … (full list from your schema)

Tables that stay **global** (no school_id): **roles**, **schools**, and optionally **users** (with school_id on users to indicate which school they belong to).

### 3.4 Migrating existing data (if you already have one school live)

- Create one row in **schools** (e.g. “Default School”, status = 'active', trial_ends_at = NULL).
- Set **users.school_id** = that school’s id for all existing users.
- For every tenant table: add column **school_id**, backfill with that school’s id, then set NOT NULL and add FK.

---

## 4. School Registration Flow

1. **Public page** (e.g. `/register-school` or `/register`).
2. Form: School name, Admin full name, Admin email, Password (and optionally phone).
3. Backend **public** API (no auth): `POST /api/v1/public/schools/register`.
   - Validate input (email format, password strength, school name non-empty).
   - Check **email** not already in **users** (or allow and link to new school – your product choice).
   - Create **school**: status = `'trial'`, trial_starts_at = NOW(), trial_ends_at = NOW() + 30 days, slug = from school name (unique).
   - Create **user**: role = admin (role_id for ‘admin’), school_id = new school.id, email, hashed password, name.
   - (Optional) Create default **general_settings** row for this school_id.
   - Return success + “Please login” or auto-login with token (your choice).
4. Frontend: redirect to **login** or dashboard; user logs in and lands in **their school’s** admin panel.

No payment or plan selection in v1; every new school starts as trial.

---

## 5. Trial Period (30 days)

- **Stored:** `schools.trial_ends_at`, `schools.status`.
- **Enforcement:**
  - **Option A (recommended):** On **login**, if school.status is `'expired'` (or trial_ends_at < now and status still `'trial'`), return 401 with message “Trial expired. Please contact us to upgrade.”
  - **Option B:** In addition, a **middleware** on every protected API: if `req.user.school_id` and school is expired, return 403 and message “Trial expired. Contact us to upgrade.”
- **Frontend:** After login, if trial ended, show a single “Trial expired – contact us to upgrade” page (no access to rest of app). Optionally show a countdown or “X days left” in header during trial.
- **Upgrade path (v1):** No self-service payment. You (or support) set school to `active` from **Platform Admin** (e.g. “Mark as upgraded” or “Extend trial”); optionally set trial_ends_at = NULL or far future for “active” schools.

---

## 6. Platform Admin Panel (Backend Admin)

- **Who:** Only **platform superadmin** (e.g. user with role `superadmin` and **school_id IS NULL**).
- **Where:** Either:
  - **Same React app:** e.g. route `/platform` or `/backend-admin`; only rendered if user is platform superadmin; menu item “Platform Admin” only for them.
  - **Separate small app:** e.g. `platform-admin/` (React/Vite) that talks to same backend; login with superadmin account; no school_id in token for that user.
- **APIs:** Under **/api/v1/platform/** (or /api/v1/backend-admin), protected by “platform admin only” middleware (check role + school_id IS NULL).
  - **GET /schools** – list all schools (with filters: status, trial ending soon, search by name/email).
  - **GET /schools/:id** – school detail + basic stats (e.g. no. of students, users).
  - **PATCH /schools/:id** – update school: name, status (trial | active | expired | suspended), trial_ends_at (extend trial), custom_domain.
  - Optional: **GET /schools/:id/usage** – storage, users count, etc., if you track them.
- **UI (minimal v1):** Table of schools (name, admin email, status, trial_ends_at, custom_domain, created_at); actions: Edit, Extend trial (e.g. +30 days), Mark as upgraded (set status = active), Set custom domain.

---

## 7. Email Configuration (per school when custom domain is set)

- **Default (no custom domain):** All schools use the **same** global email (SMTP) configuration. No per-school SMTP.
- **When a school has a custom domain:** That school **can** have its **own** email settings (e.g. SMTP, from_address like `noreply@theirschool.com`). So: either keep one global `email_settings` and add optional **per-school overrides** (e.g. `school_email_settings` table keyed by school_id), or allow school-level email config only when `schools.custom_domain` is set.
- **Templates:** All outgoing emails (admission, parent account, password reset, etc.) must use **templates that accept school-specific data** (e.g. school name, logo URL) so the recipient sees that school’s branding, not a generic one. Templates stay shared; content is parameterized by school.

---

## 7a. Custom Domain – What We’re Asking (clarification)

“Custom domain” can mean two different things. We need your preference for the **first release**:

**Part A – Configure and save the domain (we will do this)**  
- In the database we store the school’s custom domain (e.g. `app.schoolname.com`).  
- In **Platform Admin** (and optionally in school settings) you or the school can **enter and save** this value.  
- So we **record** that “School X uses domain app.schoolname.com”.  
- No server or DNS change yet; it’s just configuration.

**Part B – Actually use that domain when someone visits**  
- When a user opens **app.schoolname.com** in the browser, your **server** (e.g. Nginx + your app) must:  
  - Accept requests to that hostname (DNS for app.schoolname.com points to your server).  
  - Optionally get an SSL certificate for that hostname.  
  - Your app (backend/frontend) reads the **Host** header, finds which school has `custom_domain = app.schoolname.com`, and shows **that school’s** portal (admin panel or student portal).  

So the question is:

- Do you want **only Part A** in the first release (so we can “configure custom domain” and store it, and Part B will come later when you’re ready to set up DNS/SSL and routing)?  
- Or do you want **both Part A and Part B** in the first release (so as soon as a custom domain is configured and DNS is pointed to you, visiting that domain actually loads that school’s portal)?

**Decision (low complexity, low risk, easy to implement):** First release = **Part A only**. Part B (Host-based resolution, DNS/SSL) in a later phase.

---

## 7b. Custom Domain – Technical Design (Part A in scope)

- **Schema:** **schools.custom_domain** (e.g. `app.schoolname.com`), nullable.
- **In scope (Part A):** Platform Admin UI to set/edit **custom_domain** per school; value stored in DB. Optional: display short note “DNS/SSL can be configured later when you enable custom domain access.”
- **Out of scope for first release (Part B):** Host-based resolution (reading Host header to serve that school’s portal), DNS setup, per-domain SSL. To be implemented in a later phase.

---

## 8. Auth and Scoping Changes

- **Login response:** Include in JWT (or in response body): **school_id**, **school_name**, **school_status**, **trial_ends_at** (and optionally **is_platform_admin**).
- **Middleware:** After auth, load school by user’s school_id; if school is expired/suspended, return 403 with “Trial expired” or “School suspended”.
- **All tenant queries:** Ensure every SELECT/INSERT/UPDATE on tenant tables includes **school_id** (from req.user.school_id or req.schoolId from Host resolution). Use a shared **getSchoolId(req)** helper so controllers stay clean.

---

## 9. Phased Implementation Plan

### Phase 1 – Foundation (multi-tenant data model)

1. Add **schools** table (with status, trial_starts_at, trial_ends_at, custom_domain, slug).
2. Add **school_id** to **users** (nullable for superadmin).
3. Add **school_id** to all tenant tables (migration script); backfill existing data to one default school.
4. Ensure **roles** and any global config stay shared; tenant-specific config (e.g. general_settings) get school_id.

### Phase 2 – School registration & trial

1. Public **POST /api/v1/public/schools/register** (validate, create school + admin user, set trial 30 days).
2. Frontend: **Register your school** page (form + call register API); redirect to login or dashboard.
3. Login: return school_id + trial info; frontend stores them (e.g. context).
4. Trial enforcement: on login, if trial expired → block and show “Contact us to upgrade”; optional middleware on API.
5. Trial banner or “X days left” in admin UI (optional).

### Phase 3 – Platform Admin (same React app, route /platform)

1. **Platform-only middleware:** Allow only users with role superadmin and school_id IS NULL.
2. **APIs:** GET/PATCH schools; PATCH to extend trial, set status, set custom_domain.
3. **UI:** New route **/platform** in the existing React app; sidebar/menu entry “Platform Admin” only for platform superadmin; table of schools, filters, edit form (status, trial_ends_at, custom_domain).

### Phase 4 – Custom domain (optional / later)

1. Tenant resolution middleware: resolve school from Host header (main domain + slug vs custom_domain).
2. School settings UI: field “Custom domain” (saved to schools.custom_domain); Platform Admin can edit/approve.
3. Docs or in-app instructions: “Point your domain CNAME to …”.

---

## 10. What Stays the Same

- Existing **roles** and **permissions** (admin, teacher, student, parent, etc.) unchanged; they remain per-user; only **school_id** is added to scope data.
- **Login** flow and password hashing unchanged; only response and JWT payload gain school_id and trial info.
- **Admin frontend** structure unchanged; all existing APIs are extended to filter by school_id (and optionally to resolve school from Host later).
- **SchoolPortal** (student/parent portal): same app; after you add school resolution (subdomain or custom domain), it will show data for the resolved school.

---

## 11. Risks and Mitigations

| Risk                                                   | Mitigation |
|------                                                  |------------|
| Forgetting to scope a query (data leak across schools) | Central **getSchoolId(req)**; code review; list all tenant tables and ensure each query uses school_id. |
| Existing production DB with data | Run migrations in maintenance window; backfill default school_id; test thoroughly on staging copy first. |
| Superadmin and school admin both use “admin” role | Distinguish by **school_id IS NULL** (platform) vs NOT NULL (school admin). Platform routes only for NULL. |

---

## 12. Summary Checklist for Your Confirmation

- [x] **Trial length:** 30 days.
- [x] **Email:** Same SMTP for all schools by default; when a school has custom domain, that school can have its own email config; templates updated for school-specific branding.
- [x] **Platform Admin:** Inside same React app at **/platform**; superadmin only (school_id IS NULL).
- [ ] **Multi-tenant DB:** Add `schools` table; add `school_id` to users and all tenant tables; migrate existing data to one default school.
- [ ] **Register flow:** Public registration page + API; creates school (trial 30 days) + admin user; email unique globally.
- [ ] **Trial:** 30-day trial; after expiry, block access and show “Contact us to upgrade”; upgrade via Platform Admin.
- [x] **Custom domain:** Part A only in first release (store + configure in DB and Platform Admin). Part B (Host-based resolution, DNS/SSL) in a later phase.

Development can proceed in the order: **Phase 1 → 2 → 3**. Phase 4 (custom domain resolution) is deferred.

---

## 13. Creating a Platform Superadmin (for Phase 3)

To access **Platform Admin** at `/platform`, you need a user with **role = superadmin** and **school_id = NULL**. After Phase 1 migration, existing users have `school_id = 1`. To create a platform-only superadmin:

1. **Option A – New user:** Insert a user with `role_id = (SELECT id FROM roles WHERE name = 'superadmin' LIMIT 1)` and `school_id = NULL`. Use a dedicated email (e.g. `platform@yourcompany.com`).
2. **Option B – Convert existing:** If you have an existing superadmin that should only manage the platform (not a specific school), set `school_id = NULL` for that user:  
   `UPDATE users SET school_id = NULL WHERE email = 'your-platform-admin@example.com';`

After logging in with that account, the sidebar shows **Platform Admin** and you can manage all schools, extend trials, set status, and custom domain.

**How to run Platform Admin (step-by-step):**
1. **Create the platform admin user** (one-time). Run the script `database/create_platform_admin_user.sql` on your database (after migration 036). It creates user `platform@schoolwizard.com` with password `admin123` and `school_id = NULL`. Alternatively, set an existing user’s `school_id = NULL` (Option B in the script or Section 13 Option B above).
2. **Start** the backend and frontend (e.g. `npm run dev` in each).
3. **Log out** if you are already logged in (so the app doesn’t use a school-admin session).
4. **Log in** with the platform admin account (e.g. `platform@schoolwizard.com` / `admin123`).
5. **Open Platform Admin:** the sidebar will show **Platform Admin**; click it or go to `/platform` to list schools, edit, extend trial, set status, and custom domain.

**Why don’t I see “Platform Admin” in the sidebar?**  
The option is shown only for a user with **role = superadmin** and **school_id = NULL**. If you are logged in as a school admin (e.g. default admin with `school_id = 1`), the link is hidden. Log in with the platform admin user created in step 1.

**Is Platform Admin implemented?**  
Yes. Frontend: `frontend/src/pages/platform/PlatformAdmin.tsx` (and `PlatformAdmin.css`), route `/platform`, sidebar entry when `user` is platform superadmin. Backend: `/api/v1/platform/*` routes, `requirePlatformAdmin` middleware. You need a DB user with `school_id = NULL` and role superadmin to use it.

---

## 14. Data isolation – Subjects and subject groups

If a **newly registered school** sees **subjects or subject groups** from another school, the cause was that the Academics API (subjects and subject groups) was not filtered by `school_id`. That has been fixed: all subject and subject group list/create/update/delete operations are now scoped by the logged-in user’s school.

- **You do not need a fresh registration.** After the fix, your new school will see an **empty** list of subjects and subject groups until it creates its own. Existing data in the database stays with the school it was assigned to (e.g. `school_id = 1` for the first school).
- If your new school already created some subjects/groups, they are stored with its `school_id` and will continue to show. Any rows that were created before the fix without `school_id` would have been assigned a default by migration 036; if you see wrong data, ensure migration 036 has been applied and the backend has been restarted so the updated Academics controller is in use.
