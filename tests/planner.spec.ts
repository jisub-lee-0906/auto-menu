import { expect, test } from '@playwright/test';
import {
  EMPTY_MENU,
  SLOT_KEYS,
  SLOT_LABELS,
  createBackup,
  isMenu,
  localDateKey,
  parseBackup,
  parsePlanDays,
  repeatNames,
  shiftWeek,
  weekCsv,
  weekDates,
  type PlanDays,
} from '@/lib/planner';
import type { Menu } from '@/lib/menuGenerator';

const meal = (overrides: Partial<Menu> = {}): Menu => ({
  rice: '현미밥',
  soup: '미역국',
  main: '불고기',
  side1: '시금치나물',
  side2: '두부조림',
  kimchi: '배추김치',
  dessert: '사과',
  ...overrides,
});

const planned = (menu: Menu = meal(), note = '', noSchool = false) => ({ menu, note, noSchool });

test('planner constants expose all seven menu slots and independent empty values', () => {
  expect(SLOT_KEYS).toEqual(['rice', 'soup', 'main', 'side1', 'side2', 'kimchi', 'dessert']);
  expect(Object.keys(SLOT_LABELS)).toEqual(SLOT_KEYS);
  expect(Object.values(SLOT_LABELS).every((label) => /[가-힣]/.test(label))).toBe(true);
  expect(EMPTY_MENU).toEqual(meal({ rice: '', soup: '', main: '', side1: '', side2: '', kimchi: '', dessert: '' }));
});

test('localDateKey uses local calendar fields instead of UTC conversion', () => {
  expect(localDateKey(new Date(2025, 0, 2, 0, 30))).toBe('2025-01-02');
  expect(() => localDateKey(new Date(Number.NaN))).toThrow();
});

test('weekDates returns local Monday-Friday across month, year, and leap-day boundaries', () => {
  expect(weekDates('2024-02-29')).toEqual(['2024-02-26', '2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01']);
  expect(weekDates('2023-01-01')).toEqual(['2022-12-26', '2022-12-27', '2022-12-28', '2022-12-29', '2022-12-30']);
  expect(shiftWeek('2024-12-31', 1)).toBe('2025-01-06');
  expect(shiftWeek('2024-03-06', -2)).toBe('2024-02-19');
});

test('date helpers reject malformed, impossible, and non-integral inputs', () => {
  for (const value of ['2024-2-01', '2024-02-30', '2023-02-29', '0000-01-01', '2024-01-01x']) {
    expect(() => weekDates(value), value).toThrow();
  }
  expect(() => shiftWeek('2024-01-01', 0.5)).toThrow();
  expect(() => shiftWeek('2024-01-01', Number.POSITIVE_INFINITY)).toThrow();
});

test('isMenu requires exactly bounded string values for every slot', () => {
  expect(isMenu(meal())).toBe(true);
  expect(isMenu({ ...meal(), soup: 1 })).toBe(false);
  expect(isMenu({ ...meal(), soup: 'x'.repeat(121) })).toBe(false);
  const missing: Partial<Menu> = meal();
  delete missing.dessert;
  expect(isMenu(missing)).toBe(false);
  expect(isMenu(null)).toBe(false);
});

test('parsePlanDays validates and clones the entire record', () => {
  const input = { '2024-02-29': planned(meal(), '메모', false) };
  const parsed = parsePlanDays(input);
  expect(parsed).toEqual(input);
  expect(parsed).not.toBe(input);
  expect(parsed['2024-02-29']).not.toBe(input['2024-02-29']);
  input['2024-02-29'].note = 'changed';
  expect(parsed['2024-02-29'].note).toBe('메모');
});

test('parsePlanDays rejects invalid dates, shapes, lengths, and oversized records', () => {
  const invalidValues: unknown[] = [
    null,
    [],
    { nope: planned() },
    { '2024-02-30': planned() },
    { '2024-01-01': { ...planned(), note: 'x'.repeat(501) } },
    { '2024-01-01': { ...planned(), noSchool: 'false' } },
    { '2024-01-01': { menu: meal(), note: '', noSchool: false, extra: true } },
  ];
  for (const value of invalidValues) expect(() => parsePlanDays(value)).toThrow();

  const tooMany = Object.fromEntries(Array.from({ length: 3661 }, (_, index) => [`day-${index}`, planned()]));
  expect(() => parsePlanDays(tooMany)).toThrow(/3660/);
});

test('weekCsv emits BOM, Korean headers, escaped values, and neutralizes spreadsheet formulas', () => {
  const dates = ['2024-04-01'];
  const days: PlanDays = {
    '2024-04-01': planned(
      meal({ rice: '=1+1', soup: '  +SUM(A1)', main: '@cmd', side1: '-2', side2: ' \tformula', kimchi: 'a,"b"', dessert: 'line\nbreak' }),
      '\rformula',
    ),
  };
  const csv = weekCsv(dates, days);
  expect(csv.startsWith('\uFEFF')).toBe(true);
  const expectedHeader = ['날짜', ...SLOT_KEYS.map((key) => SLOT_LABELS[key]), '메모', '급식 없음'].join(',');
  expect(csv.slice(1).split('\r\n')[0]).toBe(expectedHeader);
  expect(csv).toContain("'=1+1");
  expect(csv).toContain("'  +SUM(A1)");
  expect(csv).toContain("'@cmd");
  expect(csv).toContain("'-2");
  expect(csv).toContain("' \tformula");
  expect(csv).toContain("'\rformula");
  expect(csv).toContain('"a,""b"""');
  expect(csv).toContain('"line\nbreak"');
});

test('no-school CSV rows retain note/status but hide stored menu data', () => {
  const days: PlanDays = { '2024-04-01': planned(meal(), '재량휴업일', true) };
  const csv = weekCsv(['2024-04-01'], days);
  expect(csv).toContain('재량휴업일');
  expect(csv).toContain('예');
  for (const name of Object.values(meal())) expect(csv).not.toContain(name);
});

test('repeatNames reports exact names repeated across active days only', () => {
  const blank = { ...EMPTY_MENU };
  const days: PlanDays = {
    '2024-04-01': planned({ ...blank, rice: '중복', soup: '미역국', main: '불고기', side1: '중복', side2: '같은날만' }),
    '2024-04-02': planned({ ...blank, rice: '중복', soup: '미역국 ' }),
    '2024-04-03': planned({ ...blank, rice: '불고기' }, '', true),
    '2024-04-04': planned({ ...blank, soup: '미역국', main: '불고기' }),
  };
  expect(repeatNames(Object.keys(days), days)).toEqual(['중복', '미역국', '불고기']);
});

test('versioned backup round-trips while preserving no-school stored meals', () => {
  const days: PlanDays = { '2024-04-01': planned(meal(), '휴업', true) };
  expect(parseBackup(createBackup(days))).toEqual({ version: 1, days });
});

test('parseBackup accepts only valid JSON with exact version-1 envelope', () => {
  const invalid = [
    '',
    'null',
    '{}',
    '{bad',
    JSON.stringify({ version: 2, days: {} }),
    JSON.stringify({ version: 1 }),
    JSON.stringify({ version: 1, days: {}, extra: true }),
    JSON.stringify({ version: 1, days: { '2024-02-30': planned() } }),
  ];
  for (const text of invalid) expect(() => parseBackup(text), text).toThrow();
});
