import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = process.cwd();
const sourceRoot = path.join(root, 'public');
const outputRoot = path.join(root, 'public', 'generated', 'images');
const generatedRoot = path.join(root, 'src', 'generated');
// Imported by src/lib/images.ts at build time: keep it to what pages need.
const manifestPath = path.join(generatedRoot, 'image-manifest.json');
// Only read by this script to skip unchanged images; never imported by the site.
const cachePath = path.join(generatedRoot, 'image-cache.json');
const legacyManifestPath = path.join(generatedRoot, 'image-manifest.ts');
const widths = [160, 400, 800, 1200, 1600];
const maxWidth = widths.at(-1);
const quality = 80;
const configHash = createHash('sha256').update(JSON.stringify({ widths, quality, cap: maxWidth })).digest('hex');
// Uploads referenced by the site: root-relative paths, or URLs on the dead old WordPress host (yera.ulyssis.be).
// Paths that are part of any other URL are someone else's files and are ignored.
const imagePathPattern = /(?:(https?:\/\/yera\.ulyssis\.be)|(?<![\w.:/-]))(\/wp-content\/uploads\/[^"'\\\s)<>]+\.(?:jpe?g|png|gif|webp))/gi;

/** Same rule as dropDeadHost() in src/lib/content.ts: an old-host upload is used only if the file, or its
 *  full-size original (WordPress's "-1024x675" suffix removed), is in public/; otherwise the page drops it. */
async function oldHostUpload(uploadPath) {
  for (const candidate of [uploadPath, uploadPath.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1')]) {
    if (await fs.stat(path.join(sourceRoot, candidate)).then(() => true, () => false)) return candidate;
  }
  return undefined;
}

async function referencedPaths() {
  const files = [];
  async function collectSourceFiles(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entryPath !== generatedRoot) await collectSourceFiles(entryPath);
      } else if (/\.(?:astro|tsx?|json)$/i.test(entry.name)) files.push(entryPath);
    }
  }
  await collectSourceFiles(path.join(root, 'src'));
  const references = new Set();
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    for (const [, oldHost, uploadPath] of content.matchAll(imagePathPattern)) {
      const local = oldHost ? await oldHostUpload(uploadPath) : uploadPath;
      if (local) references.add(local.replace(/^\//, ''));
    }
  }
  return references;
}

/** Variant widths for a source: the standard steps it can fill, plus its own width when it is below the cap. */
function variantWidths(sourceWidth) {
  const steps = widths.filter(width => width <= sourceWidth);
  if (sourceWidth < maxWidth && !steps.includes(sourceWidth)) steps.push(sourceWidth);
  return steps;
}

const exists = file => fs.stat(file).then(() => true, () => false);

const references = await referencedPaths();
let previousCache = {};
try {
  previousCache = JSON.parse(await fs.readFile(cachePath, 'utf8'));
} catch {}
const manifest = {};
const cache = {};
const expectedFiles = new Set();
let generated = 0;
let processed = 0;

for (const relativePath of [...references].sort()) {
  const sourcePath = path.join(sourceRoot, relativePath);
  try {
    const metadata = await sharp(sourcePath).metadata();
    if (!metadata.width || !metadata.height) continue;
    // Use display orientation so width/height match what the browser renders.
    const rotated = (metadata.orientation ?? 1) >= 5;
    const width = rotated ? metadata.height : metadata.width;
    const height = rotated ? metadata.width : metadata.height;
    const sourceHash = createHash('sha256').update(await fs.readFile(sourcePath)).digest('hex');
    const outputDirectory = path.join(outputRoot, relativePath.slice(0, -path.extname(relativePath).length));
    const expectedWidths = variantWidths(width);
    const outputPaths = expectedWidths.map(variantWidth => path.join(outputDirectory, `${variantWidth}.webp`));
    outputPaths.forEach(file => expectedFiles.add(file));
    const previous = previousCache[relativePath];
    const upToDate = previous?.sourceHash === sourceHash && previous?.configHash === configHash
      && (await Promise.all(outputPaths.map(exists))).every(Boolean);
    if (!upToDate) {
      await fs.mkdir(outputDirectory, { recursive: true });
      for (const [index, variantWidth] of expectedWidths.entries()) {
        await sharp(sourcePath).rotate().resize({ width: variantWidth, withoutEnlargement: true }).webp({ quality }).toFile(outputPaths[index]);
        generated++;
      }
      processed++;
    }
    manifest[relativePath] = { width, height, widths: expectedWidths };
    cache[relativePath] = { sourceHash, configHash };
  } catch (error) {
    if (error?.code !== 'ENOENT') console.warn(`Skipping image ${relativePath}: ${error.message}`);
  }
}

// Remove variants no longer referenced or no longer produced (e.g. after a config change),
// so stale files don't get copied into dist or carried along in the CI cache.
let pruned = 0;
async function prune(directory) {
  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await prune(entryPath);
    else if (!expectedFiles.has(entryPath)) {
      await fs.rm(entryPath);
      pruned++;
    }
  }
  if (directory !== outputRoot && (await fs.readdir(directory)).length === 0) await fs.rmdir(directory);
}
await prune(outputRoot);

await fs.mkdir(generatedRoot, { recursive: true });
await fs.writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 1)}\n`);
await fs.rm(legacyManifestPath, { force: true });
console.log(`Responsive images: ${Object.keys(manifest).length} sources, ${processed} processed, ${generated} variants generated, ${pruned} stale variants removed.`);
