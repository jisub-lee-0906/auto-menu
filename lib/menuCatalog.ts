import structuredMenuCatalog from '@/data/menu_catalog.json';

export type MenuCategory = 'rice' | 'soup' | 'main' | 'side' | 'kimchi' | 'dessert';
export type ProteinType =
  | 'grain'
  | 'meat'
  | 'seafood'
  | 'egg'
  | 'tofu'
  | 'vegetable'
  | 'fruit'
  | 'dairy'
  | 'mixed'
  | 'other';
export type CookingMethod =
  | 'rice'
  | 'soup'
  | 'stir-fry'
  | 'fried'
  | 'grilled'
  | 'braised'
  | 'steamed'
  | 'raw'
  | 'salad'
  | 'noodle'
  | 'baked'
  | 'dessert'
  | 'other';
export type MealWeight = 'light' | 'medium' | 'heavy';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  tags: string[];
  protein: ProteinType;
  cookingMethod: CookingMethod;
  spicyLevel: 0 | 1 | 2;
  mealWeight: MealWeight;
}

export interface MenuFilters {
  excludeSpicy: boolean;
  excludeSeafood: boolean;
  excludeDairy: boolean;
  preferKorean: boolean;
}

export const menuCatalog = structuredMenuCatalog as Record<MenuCategory, MenuItem[]>;

const menuIndex = new Map<string, MenuItem>();

for (const items of Object.values(menuCatalog)) {
  for (const item of items) {
    menuIndex.set(item.name, item);
  }
}

export function itemMatchesFilters(item: MenuItem, filters: MenuFilters): boolean {
  if (filters.excludeSpicy && item.spicyLevel > 0) return false;
  if (filters.excludeSeafood && item.protein === 'seafood') return false;
  if (filters.excludeDairy && item.tags.includes('dairy')) return false;
  if (filters.preferKorean && item.category !== 'dessert' && item.category !== 'kimchi' && !item.tags.includes('korean')) {
    return false;
  }
  return true;
}

export function getFilteredCategory(category: MenuCategory, filters: MenuFilters): MenuItem[] {
  return menuCatalog[category].filter((item) => itemMatchesFilters(item, filters));
}

export function getMenuItemByName(name: string): MenuItem | undefined {
  return menuIndex.get(name);
}

export const DEFAULT_MENU_FILTERS: MenuFilters = {
  excludeSpicy: false,
  excludeSeafood: false,
  excludeDairy: false,
  preferKorean: false,
};
