# School ID Isolation Verification

This document lists **admin (authenticated)** modules and **public website** routes and whether each is correctly isolated by `school_id` for multi-tenancy. Tables that have `school_id` in migration `036_phase1_multi_tenant_schools.sql` must be queried only with a school scope.

---

## Legend

- **OK** – Controller/route uses `getSchoolId(req)` (or resolved school for public) and all tenant queries filter by `school_id`.
- **REMAINING** – Tenant tables are used but queries are **not** filtered by `school_id`; must be fixed.
- **GLOBAL** – Tables are global (no `school_id` in DB); no isolation needed.
- **PUBLIC – needs school resolution** – Public route reads/writes tenant data but does **not** resolve school (e.g. from `?school=slug` or header); will 403 or return wrong school’s data.

---

## 1. Admin (authenticated) modules

| Module | Status | Notes |
|--------|--------|--------|
| **academics** | OK | Sessions, classes, sections, class_sections, subjects, subject_groups, class_teachers – all use `getSchoolId(req)` and filter by `school_id`. |
| **students** | OK | Scoped by `school_id`. |
| **users** | OK | Scoped by `school_id`. |
| **hr** | OK | Staff, designations, departments, etc. – scoped. |
| **frontoffice** | OK | Scoped. |
| **fees** | OK | Scoped. |
| **income** | OK | Scoped. |
| **expenses** | OK | Scoped. |
| **attendance** | OK | Scoped. |
| **examinations** | OK | Exams, exam_groups, marks, templates, etc. – scoped. |
| **onlineExaminations** | OK | Scoped. |
| **homework** | OK | Scoped. |
| **library** | OK | Scoped. |
| **downloadCenter** | OK | Scoped. |
| **communicate** | OK | Scoped. |
| **inventory** | OK | Scoped. |
| **transport** | OK | Scoped. |
| **hostel** | OK | Scoped. |
| **certificate** | OK | Scoped. |
| **calendar** | OK | Scoped. |
| **chat** | OK | Scoped. |
| **alumni** | OK | Scoped. |
| **reports** | OK | Scoped. |
| **lessonPlan** | OK | Scoped. |
| **frontCms** | OK | Pages, events, galleries, news, menus, banners – scoped. |
| **frontCmsWebsite** | OK | Website settings, banners – scoped. |
| **aboutUsPage** | OK | Mission/vision, counters, history, values, achievements, leadership – scoped. |
| **admissionManagement** | OK | Important dates, contact details, inquiries – scoped. |
| **contactMessages** | OK | List/get/update/delete/create – scoped. |
| **galleryManagement** | OK | Scoped. |
| **newsEventsManagement** | OK | News articles and events – all list/get/create/update/delete scoped by `school_id` with `getSchoolId(req)`. |
| **dashboard** | OK | Counts use `school_id`. |
| **roles** | GLOBAL | `roles`, `modules`, `permissions`, `role_permissions` – no `school_id` in DB. |
| **profile** | OK (user-scoped) | Only accesses current user by `req.user.id`; no cross-tenant leak. |
| **auth** | OK | Login/school context; platform admin has `school_id = NULL`. |
| **platform** | OK | Platform-only routes; no school scope. |
| **settings** | OK | **Scoped:** `general_settings`, `sessions`, `email_settings`, `notification_settings`, `sms_settings`, `payment_gateways`, `print_settings`, `front_cms_settings`, `custom_fields`, `system_fields`, `backup_records` / `backup_settings` – all use `getSchoolId(req)` and filter/set `school_id` in queries. Backup service accepts optional `schoolId`; controller passes school context. |
| **inquiries** | OK | `createInquiry` accepts `school_id` or `school_slug` in body; resolves school and uses `school_id` in INSERT/SELECT. |
| **onlineExaminations_results** | **Verify** | Uses `students`, `online_exam_attempts`, `online_exams`, `subjects`. Student is resolved via `req.user.id` (one school). Safer to add explicit `school_id` filter on exams/subjects. |

---

## 2. Public website routes

Public routes are unauthenticated. Tenant data must be scoped by school. That requires **resolving school** per request (e.g. query `?school=slug`, header `X-School-Slug`, or subdomain) and then using that `school_id` in all queries. Currently none of the public route files use a school-resolution middleware.

| Route / file | Status | Notes |
|--------------|--------|--------|
| **publicCmsWebsite.routes** | **PUBLIC – needs school resolution** | `/login-display`: reads `general_settings` (has `school_id`) with no school filter. `/website-settings`: reads `front_cms_website_settings` with no school filter. `/banners`: reads `front_cms_banners` with no school filter. Need to resolve school (e.g. from query or header) and add `WHERE school_id = ?`. |
| **publicAboutUsPage.routes** | **PUBLIC – needs school resolution** | Uses same controller as admin (`getMissionVision`, `getCounters`, etc.) which call `getSchoolId(req)`. Public requests have no auth → `getSchoolId` returns `null` → 403 "School context required". Need middleware to resolve school from request and set `req.schoolId` (or equivalent) for public, or separate public handlers that accept `school` slug and filter by `school_id`. |
| **publicAdmission.routes** | **PUBLIC – needs school resolution** | `getImportantDates`, `getContactDetails`, `createInquiry` use `getSchoolId(req)` → null for unauthenticated → 403. Same fix: resolve school for public and pass into controller (e.g. middleware that sets `req.schoolId` from `?school=slug`). |
| **publicContactMessages.routes** | **PUBLIC – needs school resolution** | `createContactMessage` uses `getSchoolId(req)` → null for public. Contact form must know which school (e.g. `school` or `school_id` in body/query); then resolve to `school_id` and use in INSERT. |
| **publicCms.routes** | **PUBLIC – needs school resolution** | Uses `getFrontCMSSettings`, `getMenus`, `getPages`, `getEvents`, etc. from frontCms.controller – all use `getSchoolId(req)` → 403 for public. Inline slug routes (`/pages/slug/:slug`, `/events/slug/:slug`, etc.) query by slug only with **no** `school_id` → can return another school’s content. Fix: resolve school for public; use `school_id` in all queries. |
| **publicGallery.routes** | **PUBLIC – needs school resolution** | Queries `gallery_categories` and `gallery_images` with **no** `school_id`. Both tables have `school_id` in 036. Add school resolution and `WHERE school_id = ?`. |
| **publicNewsEvents.routes** | **PUBLIC – needs school resolution** | Queries `news_articles` and `events` with **no** `school_id`. Tables have `school_id`. Add school resolution and filter by `school_id`. |
| **publicExaminations.routes** | **PUBLIC – needs school resolution** | `getPublishedExams`, `getStudentResult` use `exams`, `sessions`, `exam_groups`, `students`, `exam_students` with **no** `school_id`. Results/students can leak across schools. Resolve school (e.g. by slug) and add `school_id` to all relevant queries. |

---

## 3. Summary – what’s left to do

### Admin side (authenticated)

- **newsEventsManagement.controller** – Done; all news/events scoped by `school_id`.
- **settings.controller** – Done; email, notification, SMS, payment gateways, print, front_cms_settings, custom_fields, system_fields, backup_records/backup_settings all scoped by `school_id`.
- **inquiries.controller** – Done; createInquiry accepts `school_id` or `school_slug` and scopes by `school_id`.

**Optional:**  
- **onlineExaminations_results** – Add explicit `school_id` filter when querying `online_exams` / `subjects` for stricter isolation.

### Public website

1. **School resolution**  
   - Introduce a single approach for public routes: e.g. query param `?school=slug` or header `X-School-Slug`, and middleware that resolves `slug` → `school_id` and sets `req.schoolId` (or `req.school_id`) so controllers can use it without auth.

2. **Per-route fixes**  
   - **publicCmsWebsite.routes** – Use resolved `school_id` in `general_settings`, `front_cms_website_settings`, `front_cms_banners` queries.  
   - **publicAboutUsPage** – Use resolved school in controller (middleware or param).  
   - **publicAdmission** – Same.  
   - **publicContactMessages** – Accept school slug/id in body/query; resolve to `school_id` and use in `createContactMessage`.  
   - **publicCms.routes** – Use resolved `school_id` in all CMS queries and inline slug handlers.  
   - **publicGallery.routes** – Add `school_id` to all gallery queries.  
   - **publicNewsEvents.routes** – Add `school_id` to news and events queries.  
   - **publicExaminations.routes** – Add `school_id` to exams and student/result queries.

---

## 4. Tables that have `school_id` (from migration 036)

For reference, tenant tables that already have `school_id` and must be filtered in code:

- sessions, classes, sections, class_sections, email_settings, sms_settings, notification_settings, payment_gateways, general_settings, print_settings, front_cms_settings, custom_fields, system_fields, backup_records, backup_settings, subjects, subject_groups, subject_group_subjects, class_teachers, staff, designations, departments, students, exams, exam_groups, exam_students, and many more (see 036 for full list).
- **CMS / front:** front_cms_website_settings, front_cms_banners, front_cms_pages, front_cms_events, front_cms_galleries, front_cms_news, front_cms_about_us_*, gallery_categories, gallery_images, news_articles, events, contact_messages, admission_inquiries, marketing_inquiries, etc.

**Global (no school_id):** roles, schools, modules, permissions, role_permissions, languages (per 036 comment).

---

*Generated from codebase verification. Update this doc as you complete each item.*
