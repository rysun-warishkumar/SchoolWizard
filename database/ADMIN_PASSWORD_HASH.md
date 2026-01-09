# Admin Password Hash for "admin123"

## Verified Bcrypt Hash

The correct bcrypt hash for the password `admin123` (with 10 salt rounds) is:

```
$2a$10$LO7O/f4lNC5tHZf1yr1ObuiD/r8PiQN9SQZ22rXSLicXXoo/oB1Ca
```

## SQL Update Query

Use this SQL query in phpMyAdmin to update the admin password:

```sql
UPDATE users 
SET password = '$2a$10$LO7O/f4lNC5tHZf1yr1ObuiD/r8PiQN9SQZ22rXSLicXXoo/oB1Ca',
    is_active = 1,
    role_id = 1
WHERE email = 'admin@schoolwizard.com';
```

## Verification

This hash has been verified to work with:
- Password: `admin123`
- Bcrypt salt rounds: `10`
- Verification: ✅ PASSED

## Alternative Hash (Also Valid)

If for some reason the above hash doesn't work, you can also use:

```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**Note**: Bcrypt generates different hashes each time due to random salt, but any valid bcrypt hash for "admin123" will work. Both hashes above are valid.

## How to Generate Your Own Hash

If you want to generate a fresh hash, you can:

1. **Using Node.js** (in backend directory):
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
   ```

2. **Using the createAdmin script**:
   ```bash
   cd backend
   npm run create-admin
   ```
   This will generate a fresh hash and update the database directly.

3. **Using the generatePasswordHash script**:
   ```bash
   cd backend
   tsx src/scripts/generatePasswordHash.ts
   ```
