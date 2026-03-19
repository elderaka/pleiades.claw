#!/usr/bin/env node
/**
 * Direct plugin discovery diagnostic
 * Uses the actual plugin discovery code to identify boundary failures
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// Dynamically require the discovery module
let discovery;
try {
  discovery = await import(path.join(repoRoot, "dist", "plugins", "discovery.js"));
} catch (err) {
  console.error("Could not load plugin discovery module - build may be needed");
  console.error("Error:", err.message);
  process.exit(1);
}

// Run discovery on bundled extensions
const diagnostics = [];
const candidates = [];
const seen = new Set();

try {
  discovery.discoverBundledExtensions({
    extensionsDir: path.join(repoRoot, "extensions"),
    candidates,
    diagnostics,
    seen,
  });

  console.log("\n=== PLUGIN DISCOVERY DIAGNOSTICS ===\n");
  console.log(`Found ${candidates.length} plugin candidates`);
  console.log(`Found ${diagnostics.length} diagnostic issues\n`);

  if (diagnostics.length > 0) {
    console.log("Issues:");
    const escapesIssues = diagnostics.filter((d) =>
      d.message.includes("escapes package directory")
    );

    console.log(`Total: ${diagnostics.length}`);
    console.log(`  - Boundary escapes: ${escapesIssues.length}`);

    if (escapesIssues.length > 0) {
      console.log("\nPlugins with boundary escape issues:");
      for (const diag of escapesIssues) {
        console.log(`  • ${diag.source || "unknown"}`);
        console.log(`    ${diag.message}`);
      }
    }

    // Show all diagnostics
    console.log("\nAll diagnostics:");
    for (const diag of diagnostics) {
      console.log(`  [${diag.level}] ${diag.message}`);
      if (diag.source) console.log(`       at ${diag.source}`);
    }
  }
} catch (err) {
  console.error("Error during discovery:", err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
}
