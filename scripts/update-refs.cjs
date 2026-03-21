const fs = require('fs');
const path = require('path');

const ROOT = require('path').resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.next', '.git', 'scripts', 'public']);

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { processDir(full); continue; }
    if (!/\.(tsx?|jsx?|mjs)$/.test(entry.name)) continue;
    
    let content = fs.readFileSync(full, 'utf8');
    const regex = /\/images\/([^"'\s`]+?)\.png/g;
    const matches = content.match(regex);
    if (!matches) continue;
    
    const newContent = content.replace(regex, '/images/$1.webp');
    fs.writeFileSync(full, newContent);
    console.log(`Updated: ${full.replace(ROOT + path.sep, '')} (${matches.length} replacements)`);
  }
}

processDir(ROOT);
console.log(`\nSearched from: ${ROOT}`);
console.log('Done!');
