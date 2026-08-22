import { readdir, readFile, writeFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import Database from 'better-sqlite3';

const dbPath = join(process.cwd(), 'dev.db');
let db = null;

if (existsSync(dbPath)) {
  db = new Database(dbPath);
}

const subdirs = ['uploads', 'uploads/posts', 'uploads/wallpaper'];
const nonWebpRegex = /\.(jpg|jpeg|png|bmp|tiff|heic)$/i;

console.log('🔍 Starting automatic media scan & WebP optimization...\n');

let totalScanned = 0;
let convertedCount = 0;
let totalOriginalBytes = 0;
let totalNewBytes = 0;

for (const subdir of subdirs) {
  const fullDirPath = join(process.cwd(), 'public', subdir);
  if (!existsSync(fullDirPath)) continue;

  const entries = await readdir(fullDirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.') || !nonWebpRegex.test(entry.name)) continue;

    totalScanned++;
    const oldFilePath = join(fullDirPath, entry.name);
    const oldUrl = `/${subdir}/${entry.name}`;
    const baseName = entry.name.substring(0, entry.name.lastIndexOf('.'));
    const newFileName = `${baseName}.webp`;
    const newFilePath = join(fullDirPath, newFileName);
    const newUrl = `/${subdir}/${newFileName}`;

    try {
      const origStat = await stat(oldFilePath);
      totalOriginalBytes += origStat.size;

      const buffer = await readFile(oldFilePath);
      const webpBuffer = await sharp(buffer).webp({ quality: 85, effort: 4 }).toBuffer();

      await writeFile(newFilePath, webpBuffer);
      totalNewBytes += webpBuffer.byteLength;

      if (db) {
        db.prepare('UPDATE Post SET imageUrl = ? WHERE imageUrl = ?').run(newUrl, oldUrl);
        db.prepare('UPDATE Image SET url = ? WHERE url = ?').run(newUrl, oldUrl);
        db.prepare('UPDATE Setting SET value = ? WHERE value = ?').run(newUrl, oldUrl);
      }

      await unlink(oldFilePath);
      convertedCount++;
      console.log(`✓ Converted: ${entry.name} -> ${newFileName} (${(origStat.size / 1024).toFixed(1)} KB -> ${(webpBuffer.byteLength / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ Failed to convert ${entry.name}:`, err.message);
    }
  }
}

const savedMB = ((totalOriginalBytes - totalNewBytes) / (1024 * 1024)).toFixed(2);
console.log(`\n🎉 Optimization completed! Converted ${convertedCount}/${totalScanned} images, saved ${savedMB} MB.`);
