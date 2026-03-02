# Database SQL Files

This folder contains consolidated SQL files for easy database setup.

## 📁 Available Files

### Option 1: Single File (Easiest)
- **`00_complete_database.sql`** - Complete database in ONE file
  - ✅ Simplest: Import just one file
  - ✅ Fastest setup
  - ⚠️ Large file size (~140KB)

### Option 2: Modular Files (Recommended for Development)
- **`01_core_base_tables.sql`** - Core system tables (Users, Roles, Sessions, Settings, RBAC)
- **`02_academics_students.sql`** - Academics and Students tables
- **`03_hr_front_office_financial.sql`** - HR, Front Office, Fees, Income, Expenses
- **`04_operations_modules.sql`** - All operational modules (Attendance, Exams, Library, etc.)
- **`05_cms_website.sql`** - CMS and Website tables

  - ✅ Organized by module
  - ✅ Easier to debug specific sections
  - ✅ Better for development
  - ⚠️ Need to import 5 files in order

## 🚀 Quick Setup

### Using Single File (Recommended for Production)
```bash
# Import single file
mysql -u root -p schoolwizard < 00_complete_database.sql
```

### Using Modular Files (Recommended for Development)
```bash
# Import files in order
mysql -u root -p schoolwizard < 01_core_base_tables.sql
mysql -u root -p schoolwizard < 02_academics_students.sql
mysql -u root -p schoolwizard < 03_hr_front_office_financial.sql
mysql -u root -p schoolwizard < 04_operations_modules.sql
mysql -u root -p schoolwizard < 05_cms_website.sql
```

### Using phpMyAdmin
1. Create database `schoolwizard`
2. Select the database
3. Click "Import" tab
4. Choose file (`00_complete_database.sql` OR files 01-05 in order)
5. Click "Go"

## Multi-tenant (Phase 1)

For **multi-tenant** setup (multiple schools in one database), after importing the full schema (single file or 01–05), run the Phase 1 migration:

```bash
mysql -u root -p schoolwizard < ../migrations/036_phase1_multi_tenant_schools.sql
```

This adds the `schools` table, adds `school_id` to `users` and all tenant tables, and backfills existing data to a default school. See `docs/SCHOOL_REGISTRATION_AND_TRIAL_PLAN.md`.

## 📝 Notes

- All files use `CREATE TABLE IF NOT EXISTS` - safe to run multiple times
- Default admin user is created: `admin@schoolwizard.com` / `admin123`
- Change admin password after first login!
- Original migration files are in `../migrations/` (can be deleted if not needed)

## 🔄 Original Migration Files

The original 41 migration files are stored in `database/migrations/` folder. These are kept for reference but are **not needed** for deployment. You can safely delete the `migrations` folder if you only want to use the consolidated files.

