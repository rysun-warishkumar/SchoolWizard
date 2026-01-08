import { getDatabase, connectDatabase } from '../config/database';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const verifyAdmin = async () => {
  try {
    await connectDatabase();
    const db = getDatabase();

    const email = 'admin@schoolwizard.com';
    const password = 'admin123';

    console.log('🔍 Checking database...\n');

    // Check if database connection works
    const [test] = await db.execute('SELECT 1 as test') as any[];
    console.log('✅ Database connection: OK');

    // Check if users table exists
    const [tables] = await db.execute(
      "SHOW TABLES LIKE 'users'"
    ) as any[];
    
    if (tables.length === 0) {
      console.log('❌ Users table does not exist!');
      console.log('Please run the database schema first.');
      process.exit(1);
    }
    console.log('✅ Users table exists');

    // Check if roles table exists and has superadmin
    const [roles] = await db.execute(
      'SELECT * FROM roles WHERE name = ? OR id = 1',
      ['superadmin']
    ) as any[];
    
    if (roles.length === 0) {
      console.log('❌ Superadmin role does not exist!');
      console.log('Please run the database schema first.');
      process.exit(1);
    }
    console.log('✅ Superadmin role exists (ID:', roles[0].id + ')');

    // Check if user exists
    const [users] = await db.execute(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email]
    ) as any[];

    if (users.length === 0) {
      console.log('❌ Admin user does not exist!');
      console.log('Creating admin user...\n');
      
      // Create the user
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, 1, 1, NOW())',
        [email, hashedPassword, 'System Administrator']
      ) as any[];
      
      console.log('✅ Admin user created!');
      console.log('User ID:', result.insertId);
    } else {
      const user = users[0];
      console.log('\n📋 Admin User Found:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Name:', user.name);
      console.log('  Role:', user.role_name);
      console.log('  Active:', user.is_active ? 'Yes' : 'No');
      console.log('  Role ID:', user.role_id);
      console.log('  Password Hash:', user.password.substring(0, 20) + '...');
      
      // Test password
      console.log('\n🔐 Testing password...');
      const isValid = await bcrypt.compare(password, user.password);
      
      if (isValid) {
        console.log('✅ Password is valid!');
      } else {
        console.log('❌ Password is INVALID!');
        console.log('\nUpdating password...');
        
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
          'UPDATE users SET password = ? WHERE email = ?',
          [hashedPassword, email]
        );
        
        console.log('✅ Password updated!');
        
        // Verify again
        const [updatedUsers] = await db.execute(
          'SELECT password FROM users WHERE email = ?',
          [email]
        ) as any[];
        
        const newIsValid = await bcrypt.compare(password, updatedUsers[0].password);
        console.log('✅ Password verification after update:', newIsValid ? 'PASSED' : 'FAILED');
      }
    }

    console.log('\n✅ Verification complete!');
    console.log('\nYou can now login with:');
    console.log('  Email: admin@schoolwizard.com');
    console.log('  Password: admin123\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

verifyAdmin();

