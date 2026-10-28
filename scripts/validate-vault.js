#!/usr/bin/env node
// Validates the vault against OKF + the vault profile.
// Usage: node scripts/validate-vault.js [docsDir]   (exit code 1 on any problem)
const fs = require('fs');
const path = require('path');

const docs = path.resolve(process.argv[2] || path.join(__dirname, '..', 'docs'));
const SKIP_DIRS = new Set(['spec-kit-custom-rbajor']); // extension source files, not notes
const PROFILE_FIELDS = ['status', 'confidence', 'source', 'updated'];
const ENUMS = { status: ['draft', 'stable', 'outdated', 'archived'], confidence: ['high', 'medium', 'low'] };

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) files.push(p);
  }
})(docs);

const problems = [];
const report = (file, msg) => problems.push(`${path.relative(docs, file)}: ${msg}`);
const isStructural = name => name === 'log.md' || name === 'index.md' || name.endsWith('.index.md');

// Unique note names — `[[Name]]` must never need a path.
const names = new Map();
for (const f of files) {
  const n = path.basename(f, '.md');
  if (n !== 'log') names.set(n, [...(names.get(n) || []), f]);
}
for (const [n, list] of names) if (list.length > 1) report(list[0], `duplicate note name "${n}" (${list.length} files)`);

const linkedTo = new Set();
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const base = path.basename(f);
  const fm = (text.match(/^---\n([\s\S]*?)\n---\n/) || [])[1];

  // Frontmatter: `type` everywhere, profile fields on concept notes.
  if (fm === undefined) report(f, 'missing frontmatter');
  else {
    const field = k => (fm.match(new RegExp(`^${k}:[ \\t]*(.*)$`, 'm')) || [])[1];
    if (!field('type')) report(f, 'missing `type`');
    if (!isStructural(base)) {
      for (const k of PROFILE_FIELDS) {
        const v = field(k);
        if (v === undefined || v.trim() === '') report(f, `missing \`${k}\``);
        else if (ENUMS[k] && !ENUMS[k].includes(v.trim())) report(f, `invalid ${k}: ${v.trim()}`);
        else if (k === 'updated' && !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) report(f, `invalid updated: ${v.trim()}`);
      }
    }
  }

  // Wiki-links outside code must resolve.
  let fence = false;
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    for (const m of line.replace(/`[^`]*`/g, '').matchAll(/\[\[([^\]|#\\]+)/g)) {
      const target = m[1].trim();
      if (target === 'log') continue;
      if (!names.has(target)) report(f, `broken link [[${target}]]`);
      else linkedTo.add(target);
    }
  }

  // Logs: dated entries, newest first.
  if (base === 'log.md') {
    const dates = [...text.matchAll(/^## (\S+)/gm)].map(m => m[1]);
    dates.forEach(d => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) report(f, `log heading not a date: ${d}`); });
    for (let i = 1; i < dates.length; i++) if (dates[i] > dates[i - 1]) report(f, `log not newest-first at ${dates[i]}`);
  }
}

// Orphans: concept notes nothing links to (captures are expected to be orphans).
for (const [n, [f]] of names) {
  if (isStructural(path.basename(f)) || f.includes(`${path.sep}inbox${path.sep}`)) continue;
  if (!linkedTo.has(n)) report(f, 'orphan — no note links here');
}

if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\n${problems.length} problem(s) in ${files.length} files`);
  process.exit(1);
}
console.log(`OK — ${files.length} files, ${names.size} unique names`);
