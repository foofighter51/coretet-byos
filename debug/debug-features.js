// Debug script to check feature flags
console.log('Environment Variables:');
console.log('VITE_ENABLE_V2:', process.env.VITE_ENABLE_V2);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test hostname logic
const testUrls = [
  'localhost:5173',
  'beta.coretet.app',
  'coretet-beta-something.netlify.app'
];

testUrls.forEach(hostname => {
  const isV2Mode = process.env.VITE_ENABLE_V2 === 'true' || 
                   hostname === 'beta.coretet.app' ||
                   hostname.includes('coretet-beta') ||
                   hostname.includes('netlify');
  console.log(`${hostname}: V2 Mode = ${isV2Mode}`);
});