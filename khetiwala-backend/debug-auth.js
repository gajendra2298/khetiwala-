/**
 * Authentication Debug Script
 * This script helps debug JWT authentication issues
 */

const jwt = require('jsonwebtoken');

console.log('🔍 JWT Authentication Debug Tool\n');

// Test configuration
const testConfig = {
  secret: 'supersecret', // Default from your config
  expiresIn: '7d'
};

console.log('📋 Configuration:');
console.log(`Secret: ${testConfig.secret ? '***' : 'NOT SET'}`);
console.log(`Expires In: ${testConfig.expiresIn}`);
console.log('');

// Test payload
const testPayload = {
  sub: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  role: 'farmer'
};

console.log('📦 Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('');

try {
  // Step 1: Create token
  console.log('🔑 Step 1: Creating JWT token...');
  const token = jwt.sign(testPayload, testConfig.secret, { expiresIn: testConfig.expiresIn });
  console.log('✅ Token created successfully');
  console.log(`Token: ${token.substring(0, 50)}...`);
  console.log('');

  // Step 2: Verify token
  console.log('🔍 Step 2: Verifying JWT token...');
  const decoded = jwt.verify(token, testConfig.secret);
  console.log('✅ Token verified successfully');
  console.log('Decoded payload:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log('');

  // Step 3: Test Authorization header format
  console.log('📡 Step 3: Testing Authorization header format...');
  const authHeader = `Bearer ${token}`;
  console.log('✅ Authorization header format:');
  console.log(authHeader);
  console.log('');

  // Step 4: Test API endpoints
  console.log('🌐 Step 4: Test API endpoints with curl commands:');
  console.log('');
  console.log('1. Test authentication endpoint:');
  console.log(`curl -X GET http://localhost:3000/auth/test \\`);
  console.log(`  -H "Authorization: ${authHeader}"`);
  console.log('');
  console.log('2. Test profile endpoint:');
  console.log(`curl -X GET http://localhost:3000/auth/profile \\`);
  console.log(`  -H "Authorization: ${authHeader}"`);
  console.log('');
  console.log('3. Test addresses endpoint:');
  console.log(`curl -X GET http://localhost:3000/addresses \\`);
  console.log(`  -H "Authorization: ${authHeader}"`);
  console.log('');
  console.log('4. Test notifications endpoint:');
  console.log(`curl -X GET http://localhost:3000/notifications \\`);
  console.log(`  -H "Authorization: ${authHeader}"`);
  console.log('');

  // Step 5: Login test
  console.log('🔐 Step 5: Test login to get real token:');
  console.log('curl -X POST http://localhost:3000/auth/login \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email": "your-email@example.com", "password": "YourPassword123!"}\'');
  console.log('');

  console.log('🎉 JWT authentication test completed successfully!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Start your server: npm run start:dev');
  console.log('2. Test login endpoint to get a real token');
  console.log('3. Use the real token to test protected endpoints');
  console.log('4. Check server logs for any authentication errors');

} catch (error) {
  console.error('❌ JWT authentication test failed:');
  console.error('Error:', error.message);
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('1. Check if JWT_SECRET is set in your .env file');
  console.log('2. Verify the secret matches between login and validation');
  console.log('3. Check server logs for detailed error messages');
}
