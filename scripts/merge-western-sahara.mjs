import fs from 'fs';
const path = 'public/data/world.json';
const geo = JSON.parse(fs.readFileSync(path, 'utf8'));

const nameOf = f => (f.properties && (f.properties.name || f.properties.NAME || f.properties.NAME_EN)) || '';

const morocco = geo.features.find(f => nameOf(f) === 'Morocco');
const sahara = geo.features.find(f => nameOf(f) === 'W. Sahara');

if (!morocco) {
  console.error('Morocco feature not found — aborting.');
  process.exit(1);
}

if (!sahara) {
  console.log('W. Sahara already merged into Morocco (features:', geo.features.length, '). Nothing to do.');
  process.exit(0);
}

const rings = [];
for (const f of [morocco, sahara]) {
  if (f.geometry.type === 'Polygon') {
    rings.push(f.geometry.coordinates);
  } else if (f.geometry.type === 'MultiPolygon') {
    rings.push(...f.geometry.coordinates);
  }
}

morocco.geometry.type = 'MultiPolygon';
morocco.geometry.coordinates = rings;

geo.features = geo.features.filter(f => nameOf(f) !== 'W. Sahara');

fs.writeFileSync(path, JSON.stringify(geo));
console.log('Merged. Total features now:', geo.features.length);
console.log('Morocco geometry:', morocco.geometry.type, 'polygons:', rings.length);
