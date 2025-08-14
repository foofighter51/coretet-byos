#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Update version.json
const versionPath = path.join(__dirname, '../public/version.json');
const newVersion = `2.0.${Date.now()}`;
const versionData = {
  version: newVersion,
  buildDate: new Date().toISOString()
};

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
console.log(`Updated version.json to ${newVersion}`);

// Update service worker cache version
const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace the CACHE_VERSION line
swContent = swContent.replace(
  /const CACHE_VERSION = 'v\d+'/,
  `const CACHE_VERSION = 'v${Date.now()}'`
);

fs.writeFileSync(swPath, swContent);
console.log('Updated service worker cache version');

console.log('Pre-deploy updates complete!');