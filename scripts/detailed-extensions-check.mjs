#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const extensionsDir = "./extensions";

const results = {
  hasExtensions: [],
  emptyExtensions: [],
  missingExtensions: [],
  invalidJson: [],
};

for (const dir of fs.readdirSync(extensionsDir)) {
  const extPath = path.join(extensionsDir, dir);
  if (!fs.statSync(extPath).isDirectory()) continue;

  const pkgPath = path.join(extPath, "package.json");
  if (!fs.existsSync(pkgPath)) continue;

  try {
    const content = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(content);
    const extensions = pkg.openclaw?.extensions;

    if (!extensions) {
      results.missingExtensions.push(dir);
    } else if (Array.isArray(extensions) && extensions.length === 0) {
      results.emptyExtensions.push(dir);
    } else if (Array.isArray(extensions) && extensions.length > 0) {
      results.hasExtensions.push(dir);
    }
  } catch (err) {
    results.invalidJson.push({ dir, error: err.message });
  }
}

console.log("Has extensions:", results.hasExtensions.length);
console.log("Empty extensions:", results.emptyExtensions.length);
console.log("Missing extensions:", results.missingExtensions.length);
console.log("Invalid JSON:", results.invalidJson.length);

if (results.emptyExtensions.length > 0) {
  console.log("\nExtensions with EMPTY array:");
  for (const name of results.emptyExtensions) {
    console.log(`  • ${name}`);
  }
}

if (results.missingExtensions.length > 0) {
  console.log("\nExtensions without field:");
  for (const name of results.missingExtensions) {
    console.log(`  • ${name}`);
  }
}

if (results.invalidJson.length > 0) {
  console.log("\nInvalid JSON:");
  for (const { dir, error } of results.invalidJson) {
    console.log(`  • ${dir}: ${error}`);
  }
}

const total = results.hasExtensions.length + results.emptyExtensions.length + results.missingExtensions.length;
console.log(`\nTotal with package.json: ${total}`);
console.log(`Expected total (69): ${total === 69 ? "✓" : "✗"}`);
