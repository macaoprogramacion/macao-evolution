import sharp from 'sharp';
import { readdir, stat, rename } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'public');
const QUALITY = 80;

async function getAllPngs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllPngs(fullPath));
    } else if (extname(entry.name).toLowerCase() === '.png' && !entry.name.startsWith('.')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function convertToWebP(pngPath) {
  const dir = dirname(pngPath);
  const name = basename(pngPath, extname(pngPath));
  const webpPath = join(dir, `${name}.webp`);
  
  try {
    const originalStats = await stat(pngPath);
    const originalSize = originalStats.size;
    
    await sharp(pngPath)
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(webpPath);
    
    const newStats = await stat(webpPath);
    const newSize = newStats.size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
    
    const relPath = pngPath.replace(PUBLIC_DIR, '');
    console.log(`✓ ${relPath} → .webp | ${(originalSize/1024/1024).toFixed(1)}MB → ${(newSize/1024/1024).toFixed(1)}MB (${savings}% smaller)`);
    
    return { original: originalSize, converted: newSize };
  } catch (err) {
    console.error(`✗ Failed: ${pngPath}: ${err.message}`);
    return null;
  }
}

async function main() {
  const imagesDir = join(PUBLIC_DIR, 'images');
  console.log('Scanning for PNG files in public/images/...\n');
  
  const pngFiles = await getAllPngs(imagesDir);
  console.log(`Found ${pngFiles.length} PNG files\n`);
  
  let totalOriginal = 0;
  let totalConverted = 0;
  let converted = 0;
  
  for (const file of pngFiles) {
    const result = await convertToWebP(file);
    if (result) {
      totalOriginal += result.original;
      totalConverted += result.converted;
      converted++;
    }
  }
  
  console.log(`\n━━━ Summary ━━━`);
  console.log(`Converted: ${converted}/${pngFiles.length} files`);
  console.log(`Original total: ${(totalOriginal/1024/1024).toFixed(1)} MB`);
  console.log(`WebP total: ${(totalConverted/1024/1024).toFixed(1)} MB`);
  console.log(`Savings: ${((1 - totalConverted/totalOriginal) * 100).toFixed(1)}%`);
}

main().catch(console.error);
