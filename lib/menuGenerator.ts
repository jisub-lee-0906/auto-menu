import {
  DEFAULT_MENU_FILTERS,
  getFilteredCategory,
  MenuCategory,
  MenuFilters,
  MenuItem,
} from '@/lib/menuCatalog';

export interface Menu {
  rice: string;
  soup: string;
  main: string;
  side1: string;
  side2: string;
  kimchi: string;
  dessert: string;
}

export type LockedState = {
  [K in keyof Menu]: boolean;
};

function fallbackItem(category: MenuCategory): string {
  const items = getFilteredCategory(category, DEFAULT_MENU_FILTERS);
  return items[0]?.name ?? '';
}

function scoreItem(item: MenuItem, selected: Partial<Record<keyof Menu, MenuItem>>): number {
  let score = Math.random() * 0.25;

  const selectedItems = Object.values(selected).filter(Boolean);

  for (const picked of selectedItems) {
    if (!picked) continue;

    if (picked.name === item.name) {
      return -100;
    }

    if (picked.protein === item.protein && item.category === 'side') {
      score -= 2;
    }

    if (picked.cookingMethod === item.cookingMethod && item.category === 'side') {
      score -= 1.5;
    }

    if (picked.mealWeight === 'heavy' && item.mealWeight === 'heavy' && item.category !== 'dessert') {
      score -= 1;
    }
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

function chooseItem(
  category: MenuCategory,
  selected: Partial<Record<keyof Menu, MenuItem>>,
  filters: MenuFilters,
  excludeNames: string[] = []
): MenuItem | null {
  const pool = getFilteredCategory(category, filters).filter((item) => !excludeNames.includes(item.name));
  if (pool.length === 0) return null;

  const ranked = [...pool]
    .map((item) => ({ item, score: scoreItem(item, selected) }))
    .sort((a, b) => b.score - a.score);

  const finalistCount = Math.min(6, ranked.length);
  const finalist = ranked[Math.floor(Math.random() * finalistCount)].item;
  return finalist;
}

export function generateMenu(
  currentMenu?: Menu,
  lockedState?: LockedState,
  filters: MenuFilters = DEFAULT_MENU_FILTERS,
  excludedNames: string[] = []
): Menu {
  const nextItems: Partial<Record<keyof Menu, MenuItem>> = {};

  const assignField = (field: keyof Menu, category: MenuCategory, excludeNames: string[] = []) => {
    if (lockedState?.[field] && currentMenu?.[field]) {
      nextItems[field] = {
        id: `${category}-locked`,
        name: currentMenu[field],
        category,
        tags: [],
        protein: 'other',
        cookingMethod: 'other',
        spicyLevel: 0,
        mealWeight: 'medium',
      };
      return;
    }

    const chosen = chooseItem(category, nextItems, filters, [...excludeNames, ...excludedNames]);
    nextItems[field] = chosen ?? {
      id: `${category}-fallback`,
      name: fallbackItem(category),
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

  return {
    rice: nextItems.rice?.name ?? '',
    soup: nextItems.soup?.name ?? '',
    main: nextItems.main?.name ?? '',
    side1: nextItems.side1?.name ?? '',
    side2: nextItems.side2?.name ?? '',
    kimchi: nextItems.kimchi?.name ?? '',
    dessert: nextItems.dessert?.name ?? '',
  };
}
