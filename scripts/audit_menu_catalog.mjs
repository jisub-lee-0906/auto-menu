import fs from 'node:fs';
import path from 'node:path';

const menuCatalog = JSON.parse(
  fs.readFileSync(path.resolve('data/menu_catalog.json'), 'utf8')
);

const categories = ['rice', 'soup', 'main', 'side', 'kimchi', 'dessert'];
const requiredFields = ['id', 'name', 'category', 'tags', 'protein', 'cookingMethod', 'spicyLevel', 'mealWeight'];

const allItems = [];

for (const category of categories) {
  const items = menuCatalog[category];
  console.log(`${category}: total=${items.length}`);

  for (const item of items) {
    allItems.push(item);

    for (const field of requiredFields) {
      if (!(field in item)) {
        throw new Error(`Missing field "${field}" in ${category} item ${JSON.stringify(item)}`);
      }
    }

    if (item.category !== category) {
      throw new Error(`Category mismatch for ${item.id}: expected ${category}, got ${item.category}`);
    }
  }
}

const duplicateIds = allItems.length - new Set(allItems.map((item) => item.id)).size;
const duplicateNamesByCategory = [];

for (const category of categories) {
  const names = menuCatalog[category].map((item) => item.name);
  const duplicateCount = names.length - new Set(names).size;
  if (duplicateCount > 0) {
    duplicateNamesByCategory.push(`${category}: ${duplicateCount}`);
  }
}

console.log('');
console.log(`duplicate_ids=${duplicateIds}`);
console.log(`duplicate_names_by_category=${duplicateNamesByCategory.length ? duplicateNamesByCategory.join(', ') : 'none'}`);
