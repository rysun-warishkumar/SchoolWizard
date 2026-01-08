# Database Documentation

## Setup

1. Start XAMPP MySQL service
2. Create database: `CREATE DATABASE schoolwizard;`
3. Import schema: `mysql -u root schoolwizard < schema.sql`

## Database Structure

### Core Tables
- `users` - All system users (admin, staff, students, parents)
- `roles` - User roles and permissions
- `sessions` - Academic sessions
- `classes` - School classes
- `sections` - Class sections
- `subjects` - Subjects
- `students` - Student information
- `staff` - Staff information
- `parents` - Parent/Guardian information

### Module Tables
- `fees_master` - Fees structure
- `fees_collection` - Fees payments
- `attendance` - Student and staff attendance
- `examinations` - Exam details
- `examination_marks` - Exam marks
- `library_books` - Library books
- `library_issues` - Book issues
- `transport_routes` - Transport routes
- `hostel_rooms` - Hostel rooms
- And more...

## Migrations

Run migrations in order:
```bash
cd database/migrations
mysql -u root schoolwizard < 001_initial_schema.sql
mysql -u root schoolwizard < 002_add_modules.sql
# ... continue with other migrations
```

## Backup

Regular backups are recommended:
```bash
mysqldump -u root schoolwizard > backup_$(date +%Y%m%d).sql
```

## Notes

- Always use transactions for multi-step operations
- Use foreign key constraints
- Index frequently queried columns
- Never modify production database directly

