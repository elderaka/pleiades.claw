#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const extensionsDir = path.join(repoRoot, "extensions");

// Read each extension's package.json and check the extensions field
const missing = [];
const empty = [];
const has = [];

if (!fs.existsSync(extensionsDir)) {
  console.error(`Extensions directory not found: ${extensionsDir}`);
  process.exit(1);
}

const extensions = fs.readdirSync(extensionsDir, { withFileTypes: true });

for (const entry of extensions) {
  if (!entry.isDirectory()) continue;

  const extDir = path.join(extensionsDir, entry.name);
  const pkgJsonPath = path.join(extDir, "package.json");

  if (!fs.existsSync(pkgJsonPath)) continue;

  try {
    const content = fs.readFileSync(pkgJsonPath, "utf8");
    const pkg = JSON.parse(content);
    const extensionEntries = pkg.openclaw?.extensions;

    if (!extensionEntries) {
      missing.push(entry.name);
    } else if (Array.isArray(extensionEntries) && extensionEntries.length === 0) {
      empty.push(entry.name);
    } else if (Array.isArray(extensionEntries) && extensionEntries.length > 0) {
      has.push({ name: entry.name, entries: extensionEntries });
    } else {
      console.warn(`${entry.name}: extensions is not an array, value =`, extensionEntries);
    }
  } catch (err) {
    console.error(`Error reading ${pkgJsonPath}: ${err.message}`);
  }
}

console.log("\n=== PLUGIN EXTENSIONS FIELD ANALYSIS ===\n");
console.log(`Total extensions: ${extensions.filter((e) => e.isDirectory()).length}`);
console.log(`With "extensions" field: ${has.length}`);
console.log(`Missing "extensions" field: ${missing.length}`);
console.log(`Empty "extensions" array: ${empty.length}`);

if (missing.length > 0) {
  console.log(`\nMissing "extensions" field (${missing.length}):`);
  for (const name of missing) {
    console.log(`  • ${name}`);
  }
}

if (empty.length > 0) {
  console.log(`\nEmpty "extensions" array (${empty.length}):`);
  for (const name of empty) {
    console.log(`  • ${name}`);
  }
}

if (missing.length === 12 || empty.length === 12 || (missing.length + empty.length) === 12) {
  console.log("\n✓ Found the 12 plugins with missing/empty extensions fields!");
}
