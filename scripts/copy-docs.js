/* eslint-disable no-console */
// Copy docs/*.md and selected root .md files into /public for static export.
// - Recursively copies /docs → /public/docs (top-level only + subfolders)
// - Copies root README.md, CONTRIBUTING.md, EDUCATION.md, VISION.md → /public/
// Idempotent; overwrites destination files.

const fs = require("fs");
const path = require("path");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`[copy-docs] ${src} -> ${dest}`);
}

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(srcDir, e.name);
    const destPath = path.join(destDir, e.name);
    if (e.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
      copyFile(srcPath, destPath);
    }
  }
}

function main() {
  const root = process.cwd();
  const docsSrc = path.join(root, "docs");
  const docsDest = path.join(root, "public", "docs");
  copyDirRecursive(docsSrc, docsDest);

  const rootMd = ["README.md", "CONTRIBUTING.md", "EDUCATION.md", "VISION.md"];
  for (const f of rootMd) {
    const src = path.join(root, f);
    if (fs.existsSync(src)) {
      const dest = path.join(root, "public", f);
      copyFile(src, dest);
    }
  }
}

try {
  main();
} catch (err) {
  console.error("[copy-docs] error:", err);
  process.exitCode = 0; // do not fail the build on copy errors
}

