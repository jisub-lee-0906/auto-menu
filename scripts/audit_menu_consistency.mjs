import fs from 'node:fs';
import path from 'node:path';

const menuCatalog = JSON.parse(fs.readFileSync(path.resolve('data/menu_catalog.json'), 'utf8'));

const DEFAULT_MENU_FILTERS = {
  excludeSpicy: false,
  excludeSeafood: false,
  excludeDairy: false,
  preferKorean: false,
};

const SLOT_CATEGORY = {
  rice: 'rice',
  soup: 'soup',
  main: 'main',
  side1: 'side',
  side2: 'side',
  kimchi: 'kimchi',
  dessert: 'dessert',
};

const FILTER_CASES = [
  { name: 'default', filters: DEFAULT_MENU_FILTERS },
  { name: 'excludeSpicy', filters: { ...DEFAULT_MENU_FILTERS, excludeSpicy: true } },
  { name: 'excludeSeafood', filters: { ...DEFAULT_MENU_FILTERS, excludeSeafood: true } },
  { name: 'excludeDairy', filters: { ...DEFAULT_MENU_FILTERS, excludeDairy: true } },
  { name: 'preferKorean', filters: { ...DEFAULT_MENU_FILTERS, preferKorean: true } },
  {
    name: 'strict',
    filters: {
      excludeSpicy: true,
      excludeSeafood: true,
      excludeDairy: true,
      preferKorean: true,
    },
  },
];

const byName = new Map();

for (const items of Object.values(menuCatalog)) {
  for (const item of items) {
    byName.set(item.name, item);
  }
}

function itemMatchesFilters(item, filters) {
  if (filters.excludeSpicy && item.spicyLevel > 0) return false;
  if (filters.excludeSeafood && item.protein === 'seafood') return false;
  if (filters.excludeDairy && item.tags.includes('dairy')) return false;
  if (filters.preferKorean && item.category !== 'dessert' && item.category !== 'kimchi' && !item.tags.includes('korean')) {
    return false;
  }
  return true;
}

function getFilteredCategory(category, filters) {
  return menuCatalog[category].filter((item) => itemMatchesFilters(item, filters));
}

function fallbackItem(category, filters, excludedNames = []) {
  return getFilteredCategory(category, filters).find((item) => !excludedNames.includes(item.name))?.name ?? '';
}

function scoreItem(item, selected) {
  let score = Math.random() * 0.25;

  const selectedItems = Object.values(selected).filter(Boolean);

  for (const picked of selectedItems) {
    if (picked.name === item.name) return -100;
    if (picked.protein === item.protein && item.category === 'side') score -= 2;
    if (picked.cookingMethod === item.cookingMethod && item.category === 'side') score -= 1.5;
    if (picked.mealWeight === 'heavy' && item.mealWeight === 'heavy' && item.category !== 'dessert') score -= 1;
  }

  if (item.category === 'main') {
    if (item.protein === 'meat' || item.protein === 'seafood') score += 2;
    if (item.cookingMethod === 'fried') score -= 0.4;
  }

  if (item.category === 'side') {
    if (item.protein === 'vegetable' || item.cookingMethod === 'salad' || item.cookingMethod === 'raw') {
      score += 1.5;
    }
    if (item.protein === 'other' && item.mealWeight === 'light') score += 0.5;
  }

  if (item.category === 'dessert') {
    if (item.protein === 'fruit' || item.protein === 'dairy') score += 1;
    if (item.cookingMethod === 'dessert') score += 0.5;
  }

  return score;
}

function chooseItem(category, selected, filters, excludeNames = []) {
  const pool = getFilteredCategory(category, filters).filter((item) => !excludeNames.includes(item.name));
  if (pool.length === 0) return null;

  const ranked = pool
    .map((item) => ({ item, score: scoreItem(item, selected) }))
    .sort((left, right) => right.score - left.score);

  const finalistCount = Math.min(6, ranked.length);
  return ranked[Math.floor(Math.random() * finalistCount)].item;
}

function generateMenu(filters, excludedNames = []) {
  const nextItems = {};

  const assignField = (field, category, additionalExcludes = []) => {
    const nextExcludedNames = [...additionalExcludes, ...excludedNames];
    const chosen = chooseItem(category, nextItems, filters, nextExcludedNames);
    nextItems[field] = chosen ?? {
      name: fallbackItem(category, filters, nextExcludedNames),
      category,
      tags: [],
      protein: 'other',
      cookingMethod: 'other',
      spicyLevel: 0,
      mealWeight: 'medium',
    };
  };

  assignField('rice', 'rice');
  assignField('soup', 'soup');
  assignField('main', 'main');
  assignField('side1', 'side', [nextItems.main?.name ?? '']);
  assignField('side2', 'side', [nextItems.main?.name ?? '', nextItems.side1?.name ?? '']);
  assignField('kimchi', 'kimchi');
  assignField('dessert', 'dessert');

  return nextItems;
}

function validateGeneratedMenu(caseName, filters, iterations = 2000) {
  for (let index = 0; index < iterations; index += 1) {
    const menu = generateMenu(filters);

    for (const [field, expectedCategory] of Object.entries(SLOT_CATEGORY)) {
      const item = byName.get(menu[field].name);
      if (!item) {
        throw new Error(`[${caseName}] Missing catalog item for "${menu[field].name}" in slot "${field}"`);
      }

      if (item.category !== expectedCategory) {
        throw new Error(`[${caseName}] Slot "${field}" expected ${expectedCategory}, got ${item.category} (${item.name})`);
      }

      if (!itemMatchesFilters(item, filters)) {
        throw new Error(`[${caseName}] Filter violation in slot "${field}" (${item.name})`);
      }
    }
  }
}

function validateExhaustedCategory(caseName, filters, categoryToExhaust) {
  const excludedNames = getFilteredCategory(categoryToExhaust, filters).map((item) => item.name);
  const menu = generateMenu(filters, excludedNames);

  for (const [field, expectedCategory] of Object.entries(SLOT_CATEGORY)) {
    const name = menu[field].name;
    const item = byName.get(name);
    const isExhaustedSlot =
      expectedCategory === categoryToExhaust ||
      (categoryToExhaust === 'side' && (field === 'side1' || field === 'side2'));

    if (!name) {
      if (!isExhaustedSlot) {
        throw new Error(`[${caseName}] Unexpected empty slot "${field}"`);
      }
      continue;
    }

    if (!item) {
      throw new Error(`[${caseName}] Missing catalog item for "${name}" in slot "${field}"`);
    }

    if (excludedNames.includes(name)) {
      throw new Error(`[${caseName}] Excluded item resurfaced in slot "${field}" (${name})`);
    }

    if (item.category !== expectedCategory) {
      throw new Error(`[${caseName}] Slot "${field}" expected ${expectedCategory}, got ${item.category} (${item.name})`);
    }

    if (!itemMatchesFilters(item, filters)) {
      throw new Error(`[${caseName}] Filter violation in slot "${field}" (${item.name})`);
    }
  }
}

console.log('Menu consistency audit');
console.log('');

for (const [category, items] of Object.entries(menuCatalog)) {
  console.log(`${category}: total=${items.length}, filtered_strict=${getFilteredCategory(category, FILTER_CASES.at(-1).filters).length}`);
}

console.log('');

for (const { name, filters } of FILTER_CASES) {
  validateGeneratedMenu(name, filters);
  console.log(`[ok] ${name}`);
}

validateExhaustedCategory('strict-kimchi-exhausted', FILTER_CASES.at(-1).filters, 'kimchi');
console.log('[ok] strict-kimchi-exhausted');

validateExhaustedCategory('strict-side-exhausted', FILTER_CASES.at(-1).filters, 'side');
console.log('[ok] strict-side-exhausted');
