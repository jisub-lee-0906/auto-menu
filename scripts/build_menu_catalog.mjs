import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateCurated } from './curated-catalog.mjs';
import { validateProvenance } from './curation-provenance.mjs';

const data = new URL('../data/', import.meta.url);
const source = JSON.parse(fs.readFileSync(new URL('menu_curated.json', data), 'utf8'));
// Validate the complete source before writing any generated output.
const catalog = validateCurated(source);
const ledger = JSON.parse(fs.readFileSync(new URL('../docs/data-curation-decisions.json', import.meta.url), 'utf8'));
const snapshot = fs.readFileSync(new URL('../docs/menu-source-snapshot.json', import.meta.url), 'utf8');
validateProvenance(source, ledger, snapshot);
const raw = Object.fromEntries(Object.entries(catalog).map(([category, items]) => [category, items.map(item => item.name)]));
for (const [name, value] of Object.entries({
  'menu_catalog.json': catalog,
  'menu_db.json': raw,
  'menu_catalog_overrides.json': {},
  'menu_catalog_review_candidates.json': [],
})) fs.writeFileSync(new URL(name, data), `${JSON.stringify(value, null, 2)}\n`);
console.log(`Reviewed catalog built: ${source.items.length} menus; unresolved=0; source=${fileURLToPath(new URL('menu_curated.json', data))}`);
