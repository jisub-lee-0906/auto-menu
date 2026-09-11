import { expect, test } from '@playwright/test';
import {
  DEFAULT_MENU_FILTERS,
  getMenuItemByName,
  menuCatalog,
  type MenuCategory,
  type MenuFilters,
} from '@/lib/menuCatalog';
import { generateMenu, type LockedState, type Menu } from '@/lib/menuGenerator';

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
const UNLOCKED = Object.fromEntries(SLOT_KEYS.map((key) => [key, false])) as LockedState;

function assertHardFilters(menu: Menu, filters: MenuFilters, excludedNames: string[] = []) {
  for (const key of SLOT_KEYS) {
    const name = menu[key];
    expect(name, `${key} should not be empty`).not.toBe('');
    expect(excludedNames, `${key} resurfaced an excluded name`).not.toContain(name);
    const item = getMenuItemByName(name);
    expect(item, `${key} should come from the catalog`).toBeDefined();
    expect(item?.category).toBe(SLOT_CATEGORY[key]);
    if (filters.excludeSpicy) expect(item?.spicyLevel).toBe(0);
    if (filters.excludeSeafood) expect(item?.tags).not.toContain('seafood');
    if (filters.excludeDairy) expect(item?.tags).not.toContain('dairy');
  }
  expect(menu.side1).not.toBe(menu.side2);
}

test('production generation obeys hard filters for all 16 filter combinations', () => {
  for (let mask = 0; mask < 16; mask += 1) {
    const filters: MenuFilters = {
      excludeSpicy: Boolean(mask & 1),
      excludeSeafood: Boolean(mask & 2),
      excludeDairy: Boolean(mask & 4),
      preferKorean: Boolean(mask & 8),
    };
    for (let iteration = 0; iteration < 5; iteration += 1) {
      assertHardFilters(generateMenu(undefined, undefined, filters), filters);
    }
  }
});

test('preferKorean is a soft preference rather than a hard exclusion', () => {
  const koreanRice = menuCatalog.rice.filter((item) => item.tags.includes('korean')).map((item) => item.name);
  const menu = generateMenu(undefined, undefined, { ...DEFAULT_MENU_FILTERS, preferKorean: true }, koreanRice);
  expect(menu.rice).not.toBe('');
  expect(getMenuItemByName(menu.rice)?.tags).not.toContain('korean');
});

test('preferKorean raises Korean candidates in the soft score', () => {
  const korean = menuCatalog.rice.find((item) => item.tags.includes('korean'))!;
  const other = menuCatalog.rice.find((item) => !item.tags.includes('korean'))!;
  const allowed = new Set([korean.name, other.name]);
  const excluded = menuCatalog.rice.filter((item) => !allowed.has(item.name)).map((item) => item.name);
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    expect(generateMenu(undefined, undefined, { ...DEFAULT_MENU_FILTERS, preferKorean: true }, excluded).rice).toBe(korean.name);
  } finally {
    Math.random = originalRandom;
  }
});

test('excluded or exhausted candidates never resurface in any category', () => {
  for (const category of Object.keys(menuCatalog) as MenuCategory[]) {
    const excluded = menuCatalog[category].map((item) => item.name);
    const menu = generateMenu(undefined, undefined, DEFAULT_MENU_FILTERS, excluded);
    const exhaustedSlots = SLOT_KEYS.filter((key) => SLOT_CATEGORY[key] === category);
    for (const key of exhaustedSlots) expect(menu[key], `${category}:${key}`).toBe('');
    for (const key of SLOT_KEYS) expect(excluded, `${category}:${key}`).not.toContain(menu[key]);
  }
});

test('refresh changes every generated slot when alternatives exist', () => {
  const current: Menu = {
    rice: menuCatalog.rice[0].name,
    soup: menuCatalog.soup[0].name,
    main: menuCatalog.main[0].name,
    side1: menuCatalog.side[0].name,
    side2: menuCatalog.side[1].name,
    kimchi: menuCatalog.kimchi[0].name,
    dessert: menuCatalog.dessert[0].name,
  };
  const allowed = new Set([
    ...Object.values(current),
    menuCatalog.rice[1].name,
    menuCatalog.soup[1].name,
    menuCatalog.main[1].name,
    menuCatalog.side[2].name,
    menuCatalog.side[3].name,
    menuCatalog.kimchi[1].name,
    menuCatalog.dessert[1].name,
  ]);
  const excluded = Object.values(menuCatalog).flat().map((item) => item.name).filter((name) => !allowed.has(name));
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const refreshed = generateMenu(current, UNLOCKED, DEFAULT_MENU_FILTERS, excluded);
    for (const key of SLOT_KEYS) expect(refreshed[key], key).not.toBe(current[key]);
    expect(refreshed.side1).not.toBe(refreshed.side2);
  } finally {
    Math.random = originalRandom;
  }
});

test('refresh may retain the current value when it is the sole candidate', () => {
  const current = generateMenu();
  const allowedRice = current.rice;
  const excluded = menuCatalog.rice.filter((item) => item.name !== allowedRice).map((item) => item.name);
  const refreshed = generateMenu(current, UNLOCKED, DEFAULT_MENU_FILTERS, excluded);
  expect(refreshed.rice).toBe(allowedRice);
});

test('all locked values are preserved even when custom, excluded, or filter-conflicting', () => {
  const seafood = Object.values(menuCatalog).flat().find((item) => item.protein === 'seafood');
  expect(seafood).toBeDefined();
  const current: Menu = {
    rice: '직접 입력 밥',
    soup: seafood!.name,
    main: '직접 입력 주찬',
    side1: '같은 사용자 부찬',
    side2: '같은 사용자 부찬',
    kimchi: '직접 입력 김치',
    dessert: '',
  };
  const locked = Object.fromEntries(SLOT_KEYS.map((key) => [key, true])) as LockedState;
  expect(generateMenu(current, locked, { ...DEFAULT_MENU_FILTERS, excludeSeafood: true }, Object.values(current))).toEqual(current);
});

test('generated side1 avoids a preloaded locked side2 regardless of generation order', () => {
  const current = generateMenu();
  const locked = { ...UNLOCKED, side2: true };
  const excluded = menuCatalog.side.filter((item) => item.name !== current.side2).map((item) => item.name);
  const next = generateMenu(current, locked, DEFAULT_MENU_FILTERS, excluded);
  expect(next.side2).toBe(current.side2);
  expect(next.side1).toBe('');
});

test('generated side2 also avoids a preloaded locked side1', () => {
  const current = generateMenu();
  const excluded = menuCatalog.side.filter((item) => item.name !== current.side1).map((item) => item.name);
  const next = generateMenu(current, { ...UNLOCKED, side1: true }, DEFAULT_MENU_FILTERS, excluded);
  expect(next.side1).toBe(current.side1);
  expect(next.side2).toBe('');
});

test('a locked custom side is preserved and blocks the same generated side name', () => {
  const customName = menuCatalog.side[0].name;
  const current = { ...generateMenu(), side2: customName };
  const next = generateMenu(current, { ...UNLOCKED, side2: true });
  expect(next.side2).toBe(customName);
  expect(next.side1).not.toBe(customName);
});
