import {
  DEFAULT_MENU_FILTERS,
  getFilteredCategory,
  getMenuItemByName,
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

const SLOT_CATEGORY: Record<keyof Menu, MenuCategory> = {
  rice: 'rice',
  soup: 'soup',
  main: 'main',
  side1: 'side',
  side2: 'side',
  kimchi: 'kimchi',
  dessert: 'dessert',
};

const SLOT_KEYS = Object.keys(SLOT_CATEGORY) as (keyof Menu)[];

function customItem(name: string, category: MenuCategory): MenuItem {
  return {
    id: `${category}-custom`,
    name,
    category,
    tags: [],
    protein: 'other',
    cookingMethod: 'other',
    spicyLevel: 0,
    mealWeight: 'medium',
  };
}

function itemForLockedValue(name: string, category: MenuCategory): MenuItem {
  return getMenuItemByName(name) ?? customItem(name, category);
}

function scoreItem(
  item: MenuItem,
  selected: Partial<Record<keyof Menu, MenuItem>>,
  preferKorean: boolean,
): number {
  let score = Math.random() * 0.25;
  const selectedItems = Object.values(selected).filter((picked): picked is MenuItem => Boolean(picked));

  for (const picked of selectedItems) {
    if (picked.name === item.name) return -100;
    if (picked.protein === item.protein && item.category === 'side') score -= 2;
    if (picked.cookingMethod === item.cookingMethod && item.category === 'side') score -= 1.5;
    if (picked.mealWeight === 'heavy' && item.mealWeight === 'heavy' && item.category !== 'dessert') score -= 1;
  }

  if (preferKorean && item.tags.includes('korean')) score += 1.25;

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
  excludedNames: ReadonlySet<string>,
  previousName?: string,
): MenuItem | null {
  // preferKorean is deliberately ranking-only, even if an older catalog helper
  // still treats it as a filter.
  const hardFilters = { ...filters, preferKorean: false };
  const eligible = getFilteredCategory(category, hardFilters).filter((item) => !excludedNames.has(item.name));
  if (eligible.length === 0) return null;

  const alternatives = previousName ? eligible.filter((item) => item.name !== previousName) : eligible;
  const pool = alternatives.length > 0 ? alternatives : eligible;
  const ranked = pool
    .map((item) => ({ item, score: scoreItem(item, selected, filters.preferKorean) }))
    .sort((left, right) => right.score - left.score);
  const finalistCount = Math.min(6, ranked.length);
  return ranked[Math.floor(Math.random() * finalistCount)].item;
}

export function generateMenu(
  currentMenu?: Menu,
  lockedState?: LockedState,
  filters: MenuFilters = DEFAULT_MENU_FILTERS,
  excludedNames: string[] = [],
): Menu {
  const nextItems: Partial<Record<keyof Menu, MenuItem>> = {};

  // Preloading every lock makes metadata and collision checks independent of
  // generation order. Locked values intentionally bypass filters/exclusions.
  for (const field of SLOT_KEYS) {
    if (lockedState?.[field] && currentMenu) {
      nextItems[field] = itemForLockedValue(currentMenu[field], SLOT_CATEGORY[field]);
    }
  }

  const assignGenerated = (field: keyof Menu, category: MenuCategory, structuralExcludes: string[] = []) => {
    if (lockedState?.[field] && currentMenu) return;
    const exclusions = new Set([...excludedNames, ...structuralExcludes.filter(Boolean)]);
    nextItems[field] =
      chooseItem(category, nextItems, filters, exclusions, currentMenu?.[field]) ?? customItem('', category);
  };

  assignGenerated('rice', 'rice');
  assignGenerated('soup', 'soup');
  assignGenerated('main', 'main');
  assignGenerated('side1', 'side', [nextItems.main?.name ?? '', nextItems.side2?.name ?? '']);
  assignGenerated('side2', 'side', [nextItems.main?.name ?? '', nextItems.side1?.name ?? '']);
  assignGenerated('kimchi', 'kimchi');
  assignGenerated('dessert', 'dessert');

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
