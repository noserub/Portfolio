#!/usr/bin/env node
/*
  Regenerates public/share/og-default.png from scripts/og-default.svg.
  macOS: uses qlmanage. Linux CI: keeps committed PNG if qlmanage is unavailable.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const svgPath = path.join(ROOT, 'scripts', 'og-default.svg');
const outDir = path.join(ROOT, 'public', 'share');
const outPath = path.join(outDir, 'og-default.png');

function hasQlmanage() {
  try {
    execSync('which qlmanage', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function assertPng(filePath) {
  const buf = fs.readFileSync(filePath);
  const isPng = buf.length > 8 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG';
  if (!isPng) {
    throw new Error(`Expected PNG at ${filePath}`);
  }
}

if (!fs.existsSync(svgPath)) {
  console.error('Missing scripts/og-default.svg');
  process.exit(1);
}

if (!hasQlmanage()) {
  if (fs.existsSync(outPath)) {
    assertPng(outPath);
    console.log('ℹ️ qlmanage not found; keeping existing public/share/og-default.png');
    process.exit(0);
  }
  console.error('❌ qlmanage not found and public/share/og-default.png is missing');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'og-gen-'));

try {
  execSync(`qlmanage -t -s 1200 -o "${tmpDir}" "${svgPath}"`, { stdio: 'inherit' });
  const generated = path.join(tmpDir, 'og-default.svg.png');
  if (!fs.existsSync(generated)) {
    throw new Error('qlmanage did not produce og-default.svg.png');
  }
  fs.copyFileSync(generated, outPath);
  execSync(`sips -z 630 1200 "${outPath}"`, { stdio: 'inherit' });
  assertPng(outPath);
  console.log('✅ Generated public/share/og-default.png');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
