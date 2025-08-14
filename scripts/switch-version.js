#!/usr/bin/env node

/**
 * Script to switch between V1 and V2 development
 * Usage: npm run v1 or npm run v2
 */

const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version || !['v1', 'v2'].includes(version)) {
  console.error('Usage: node switch-version.js [v1|v2]');
  process.exit(1);
}

// Paths
const envPath = path.join(__dirname, '..', '.env.local');
const envV1Path = path.join(__dirname, '..', '.env.v1.example');
const envV2Path = path.join(__dirname, '..', '.env.v2.example');

// Read existing .env.local or create from template
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  const templatePath = version === 'v2' ? envV2Path : envV1Path;
  if (fs.existsSync(templatePath)) {
    envContent = fs.readFileSync(templatePath, 'utf8');
  }
}

// Update or add VITE_ENABLE_V2 flag
const lines = envContent.split('\n');
let foundFlag = false;

const updatedLines = lines.map(line => {
  if (line.startsWith('VITE_ENABLE_V2=')) {
    foundFlag = true;
    return `VITE_ENABLE_V2=${version === 'v2' ? 'true' : 'false'}`;
  }
  return line;
});

if (!foundFlag) {
  updatedLines.push(`VITE_ENABLE_V2=${version === 'v2' ? 'true' : 'false'}`);
}

// Write back
fs.writeFileSync(envPath, updatedLines.join('\n'));

// Update main.tsx to use correct App file
const mainPath = path.join(__dirname, '..', 'src', 'main.tsx');
let mainContent = fs.readFileSync(mainPath, 'utf8');

if (version === 'v2') {
  mainContent = mainContent.replace(
    "import App from './App'",
    "import App from './App.v2'"
  );
} else {
  mainContent = mainContent.replace(
    "import App from './App.v2'",
    "import App from './App'"
  );
}

fs.writeFileSync(mainPath, mainContent);

console.log(`✅ Switched to ${version.toUpperCase()} mode`);
console.log(`📝 Updated .env.local: VITE_ENABLE_V2=${version === 'v2' ? 'true' : 'false'}`);
console.log(`🚀 Run 'npm run dev' to start in ${version.toUpperCase()} mode`);

if (version === 'v2') {
  console.log(`\n📍 V2 Features will be available at:`);
  console.log(`   Local: http://localhost:5173`);
  console.log(`   Beta:  https://beta.coretet.app (after deploy)`);
}