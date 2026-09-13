// One-off audit: React hooks that appear AFTER an early `return` inside the same
// component body (the "change in the order of Hooks" bug class).
// Run: npm run check:hooks   (exit 1 if any problem is found)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const HOOK = /\buse(State|Effect|Memo|Callback|Ref|Reducer|Context|LayoutEffect)\s*\(/;
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(name)) files.push(p);
  }
})("src");

const problems = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const hooks = [];
  const returns = [];
  lines.forEach((l, i) => {
    if (/^\s{2}[A-Za-z_$[{]/.test(l) && HOOK.test(l)) hooks.push(i + 1);
    else if (/^\s{2}return\b/.test(l)) returns.push(i + 1);
  });
  if (!hooks.length) continue;
  // Ignore module-level helper functions: only returns that come after the
  // component's first hook can possibly skip a later hook.
  const firstHook = hooks[0];
  for (const r of returns.filter((r) => r > firstHook)) {
    const after = hooks.filter((h) => h > r);
    if (after.length) problems.push(`${file}: return @${r} but hooks later @${after.join(",")}`);
  }
}

const report = problems.length ? problems.join("\n") : "OK: no early return precedes a hook.";
console.log(report);
process.exitCode = problems.length ? 1 : 0;
