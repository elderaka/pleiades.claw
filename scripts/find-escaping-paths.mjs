#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const extensionsDir = "./extensions";
const problematic = [];

for (const dir of fs.readdirSync(extensionsDir)) {
  const extPath = path.join(extensionsDir, dir);
  if (!fs.statSync(extPath).isDirectory()) continue;

  const pkgPath = path.join(extPath, "package.json");
  if (!fs.existsSync(pkgPath)) continue;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const setupEntry = pkg.openclaw?.setupEntry;
    
    if (setupEntry) {
      const resolved = path.resolve(extPath, setupEntry);
      const relative = path.relative(extPath, resolved);
      
      // Check if any of the entry paths might cause issues
      if (relative.startsWith("..") || resolved.includes("../")) {
        problematic.push({
          plugin: dir,
          type: "setupEntry",
          value: setupEntry,
          escapes: true,
        });
      }
    }

    // Also check extensions
    const extensions = pkg.openclaw?.extensions || [];
    for (const ext of extensions) {
      if (typeof ext === "string") {
        const resolved = path.resolve(extPath, ext);
        const relative = path.relative(extPath, resolved);
        
        if (relative.startsWith("..") || resolved.includes("../")) {
          problematic.push({
            plugin: dir,
            type: "extension",
            value: ext,
            escapes: true,
          });
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

console.log(`Found ${problematic.length} paths that escape their package directories:\n`);
for (const item of problematic) {
  console.log(`${item.plugin} (${item.type}): "${item.value}"`);
}
