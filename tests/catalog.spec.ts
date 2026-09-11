import { expect, test } from '@playwright/test';

import {
  DEFAULT_MENU_FILTERS,
  getMenuItemByName,
  itemMatchesFilters,
  type MenuItem,
} from '../lib/menuCatalog';
import { parseAndValidateOverrides } from '../scripts/catalog-rules.mjs';

function catalogItem(name: string): MenuItem {
  const item = getMenuItemByName(name);
  expect(item, `catalog item ${name}`).toBeDefined();
  return item!;
}

test('avoids substring collisions in ingredient and cooking inference', () => {
  const chicken = catalogItem('닭강정');
  expect(chicken.protein).toBe('meat');
  expect(chicken.cookingMethod).toBe('fried');
  expect(chicken.tags).not.toContain('seafood');
  expect(getMenuItemByName('가라아게')).toBeUndefined();

  expect(catalogItem('전복미역국').cookingMethod).toBe('soup');
  expect(catalogItem('솜사탕').cookingMethod).toBe('dessert');
  expect(catalogItem('솜사탕').tags).not.toContain('korean');
  expect(getMenuItemByName('한국요구르트')).toBeUndefined();
});

test('keeps ingredient-presence tags independent from dominant protein', () => {
  const cheesePorkRice = catalogItem('눈꽃치즈제육덮밥');
  expect(cheesePorkRice.tags).toContain('dairy');
  expect(itemMatchesFilters(cheesePorkRice, {
    ...DEFAULT_MENU_FILTERS,
    excludeDairy: true,
  })).toBe(false);

  const squidPork = catalogItem('오징어제육볶음');
  expect(squidPork.protein).toBe('mixed');
  expect(squidPork.tags).toContain('seafood');
  expect(itemMatchesFilters(squidPork, {
    ...DEFAULT_MENU_FILTERS,
    excludeSeafood: true,
  })).toBe(false);
});

test('handles white kimchi without an automatic spicy classification', () => {
  expect(catalogItem('백김치').spicyLevel).toBe(0);
});

test('treats preferKorean as a soft preference rather than an exclusion', () => {
  const nonKoreanItem: MenuItem = {
    id: 'main-test',
    name: '테스트 파스타',
    category: 'main',
    tags: ['main', 'mixed', 'noodle', 'western'],
    protein: 'mixed',
    cookingMethod: 'noodle',
    spicyLevel: 0,
    mealWeight: 'medium',
  };

  expect(itemMatchesFilters(nonKoreanItem, {
    ...DEFAULT_MENU_FILTERS,
    preferKorean: true,
  })).toBe(true);
});

test('rejects duplicate, stale, and invalid override data before generation', () => {
  const raw = { side: ['군밤'] };
  const duplicate = `{
  "side:군밤": {
    "protein": "mixed"
  },
  "side:군밤": {
    "protein": "other"
  }
}`;

  expect(() => parseAndValidateOverrides(duplicate, raw)).toThrow(/Duplicate override keys: side:군밤/);
  expect(() => parseAndValidateOverrides('{"main:새우버거":{"protein":"mixed"}}', raw)).toThrow(/Stale override keys: main:새우버거/);
  expect(() => parseAndValidateOverrides('{"side:군밤":{"cookingMethod":"guessed"}}', raw)).toThrow(/Invalid cookingMethod/);
});
