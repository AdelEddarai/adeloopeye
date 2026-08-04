const fs = require('fs');
const path = require('path');

function extractTemplates(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    if (src[i] === '`') {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`') break;
        j++;
      }
      out.push(src.slice(i, j + 1));
      i = j + 1;
    } else {
      i++;
    }
  }
  return out;
}

const re = /(^|[^\\])\\([1-9]|0[0-9])/;
let hits = 0;
let scanned = 0;
function walk(dir, depth) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === '.bin' || e.name.startsWith('.')) continue;
      if (depth < 3) walk(path.join(dir, e.name), depth + 1);
      else continue;
    } else if (/\.(js|mjs|cjs)$/.test(e.name) && !e.name.endsWith('.min.js')) {
      const p = path.join(dir, e.name);
      let src;
      try { src = fs.readFileSync(p, 'utf8'); } catch { continue; }
      scanned++;
      for (const t of extractTemplates(src)) {
        if (re.test(t.text)) {
          hits++;
          if (hits <= 10) {
            const idx = t.text.search(re);
            console.log('BAD', p);
            console.log('   ', JSON.stringify(t.text.slice(Math.max(0, idx - 70), idx + 70)));
          }
        }
      }
    }
  }
}
walk('node_modules', 0);
console.log('scanned', scanned, 'files, hits:', hits);
