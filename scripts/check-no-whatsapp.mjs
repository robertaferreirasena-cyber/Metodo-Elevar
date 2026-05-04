#!/usr/bin/env node
/**
 * CI guard: fails the build if any reference to "whatsapp" is found
 * in src/ or supabase/functions/.
 *
 * Migrations (supabase/migrations/) are intentionally ignored because
 * they are immutable history.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "supabase/functions"];
const ALLOWED_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".html", ".css", ".md",
]);
const SELF = relative(ROOT, new URL(import.meta.url).pathname);
const PATTERN = /whats\s*app/i;

const matches = [];

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name === "node_modules" || name === "dist" || name === "build" || name === ".next") continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) { walk(full); continue; }
    const rel = relative(ROOT, full);
    if (rel === SELF) continue;
    const dot = name.lastIndexOf(".");
    const ext = dot >= 0 ? name.slice(dot) : "";
    if (!ALLOWED_EXT.has(ext)) continue;
    let content;
    try { content = readFileSync(full, "utf8"); } catch { continue; }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (PATTERN.test(lines[i])) {
        matches.push(`${rel}:${i + 1}: ${lines[i].trim().slice(0, 200)}`);
      }
    }
  }
}

for (const d of SCAN_DIRS) walk(join(ROOT, d));

if (matches.length > 0) {
  console.error("\n❌ check-no-whatsapp: forbidden 'whatsapp' references found:\n");
  for (const m of matches) console.error("  " + m);
  console.error(`\nTotal: ${matches.length} occurrence(s). Remove them before building.\n`);
  process.exit(1);
}

console.log("✅ check-no-whatsapp: OK (no whatsapp references in src/ or supabase/functions/)");
