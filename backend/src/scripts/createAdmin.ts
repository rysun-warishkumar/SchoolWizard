import bcrypt from 'bcryptjs';
import { getDatabase, connectDatabase } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDatabase();
    const db = getDatabase();

    const email = 'admin@schoolwizard.com';
    const password = 'admin123';
    const name = 'System Administrator';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Generated password hash:', hashedPassword);

    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existingUsers.length > 0) {
      // Update existing user
      await db.execute(
        'UPDATE users SET password = ?, name = ?, role_id = 1, is_active = 1 WHERE email = ?',
        [hashedPassword, name, email]
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new user
      await db.execute(
        'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, 1, 1, NOW())',
        [email, hashedPassword, name]
      );
      console.log('✅ Admin user created successfully');
    }

    // Verify the user
    const [users] = await db.execute(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email]
    ) as any[];

    if (users.length > 0) {
      const user = users[0];
      console.log('\n📋 Admin User Details:');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role_name);
      console.log('Active:', user.is_active);
      console.log('Password Hash:', user.password);
      
      // Test password
      const isValid = await bcrypt.compare(password, user.password);
      console.log('Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

