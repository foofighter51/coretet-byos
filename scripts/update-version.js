import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update version.json with current timestamp
const versionFile = path.join(__dirname, '..', 'public', 'version.json');
const swFile = path.join(__dirname, '..', 'public', 'sw.js');

// Generate version based on timestamp
const buildDate = new Date().toISOString();
const version = `2.0.${Date.now()}`;

// Update version.json
fs.writeFileSync(versionFile, JSON.stringify({
  version,
  buildDate
}, null, 2));

// Update service worker cache version
const swContent = fs.readFileSync(swFile, 'utf8');
const updatedSw = swContent.replace(
  /const CACHE_VERSION = 'v\d+'/,
  `const CACHE_VERSION = 'v${Date.now()}'`
);
fs.writeFileSync(swFile, updatedSw);

console.log(`Updated version to ${version} at ${buildDate}`);