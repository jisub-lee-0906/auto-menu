import fs from 'node:fs';
import path from 'node:path';

const catalog = JSON.parse(fs.readFileSync(path.resolve('data/menu_catalog.json'), 'utf8'));

const unresolved = [];

for (const [category, items] of Object.entries(catalog)) {
  for (const item of items) {
    if (item.protein === 'other' || item.cookingMethod === 'other') {
      unresolved.push({
        id: item.id,
        name: item.name,
        category,
        protein: item.protein,
        cookingMethod: item.cookingMethod,
        tags: item.tags,
      });
    }
  }
}

unresolved.sort((a, b) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.name.localeCompare(b.name, 'ko');
});

fs.writeFileSync(
  path.resolve('data/menu_catalog_review_candidates.json'),
  `${JSON.stringify(unresolved, null, 2)}\n`,
  'utf8'
);

console.log(`review_candidates=${unresolved.length}`);
