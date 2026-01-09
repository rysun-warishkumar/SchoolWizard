import bcrypt from 'bcryptjs';

/**
 * Script to generate bcrypt hash for a password
 * Usage: tsx src/scripts/generatePasswordHash.ts
 */

const generateHash = async () => {
  const password = 'admin123';
  
  console.log('🔐 Generating bcrypt hash for password: admin123\n');
  
  // Generate hash with 10 salt rounds (same as used in the app)
  const hash = await bcrypt.hash(password, 10);
  
  console.log('✅ Generated Hash:');
  console.log(hash);
  console.log('\n📋 SQL UPDATE Query:');
  console.log(`UPDATE users SET password = '${hash}', is_active = 1, role_id = 1 WHERE email = 'admin@schoolwizard.com';`);
  
  // Verify the hash works
  console.log('\n🔍 Verifying hash...');
  const isValid = await bcrypt.compare(password, hash);
  console.log('✅ Hash verification:', isValid ? 'PASSED' : 'FAILED');
  
  if (isValid) {
    console.log('\n✅ This hash is correct and can be used to update the admin password.');
  } else {
    console.log('\n❌ Hash verification failed. Something went wrong.');
  }
  
  process.exit(0);
};

generateHash().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
