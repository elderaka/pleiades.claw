#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const extensionsDir = path.join(repoRoot, "extensions");

// Read each extension's package.json and check the extensions field
const issues = [];

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
    const extensionEntries = pkg.openclaw?.extensions || [];

    for (const entryPath of extensionEntries) {
      if (typeof entryPath !== "string") continue;

      // Resolve the actual file
      const resolvedPath = path.resolve(extDir, entryPath);
      const exists = fs.existsSync(resolvedPath);

      // Check if path escapes the extension directory
      const relative = path.relative(extDir, resolvedPath);
      const escapes = relative.startsWith("..");

      if (!exists || escapes) {
        issues.push({
          extension: entry.name,
          entryPath,
          resolvedPath,
          exists,
          escapes,
          status: !exists ? "NOT_FOUND" : escapes ? "ESCAPES" : "OK",
        });
      }
    }
  } catch (err) {
    console.error(`Error reading ${pkgJsonPath}: ${err.message}`);
  }
}

console.log("\n=== PLUGIN BOUNDARY DIAGNOSTIC REPORT ===\n");

if (issues.length === 0) {
  console.log("✓ All plugins have valid entry paths.");
  process.exit(0);
}

console.log(`Found ${issues.length} plugins with issues:\n`);

const grouped = {};
for (const issue of issues) {
  if (!grouped[issue.status]) {
    grouped[issue.status] = [];
  }
  grouped[issue.status].push(issue);
}

for (const [status, items] of Object.entries(grouped)) {
  console.log(`${status} (${items.length}):`);
  for (const item of items) {
    console.log(`  • ${item.extension}`);
    console.log(`    Entry: ${item.entryPath}`);
    console.log(`    Expected: ${item.resolvedPath}`);
  }
  console.log();
}

process.exit(issues.length > 0 ? 1 : 0);
