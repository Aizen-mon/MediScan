// Quick test script to check if backend is accessible
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

console.log('Testing connection to http://localhost:5000/health...');

const req = http.request(options, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Response:', data);
  });
});

req.on('error', (error) => {
  console.error('❌ Connection Error:', error.message);
  console.error('❌ Error Code:', error.code);
  console.error('❌ Full Error:', error);
});

req.on('timeout', () => {
  console.error('❌ Request timed out');
  req.abort();
});

req.end();
