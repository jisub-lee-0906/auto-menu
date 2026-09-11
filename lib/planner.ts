import type { Menu } from '@/lib/menuGenerator';

export const SLOT_KEYS = ['rice', 'soup', 'main', 'side1', 'side2', 'kimchi', 'dessert'] as const;

export const SLOT_LABELS: Record<keyof Menu, string> = {
  rice: '밥',
  soup: '국',
  main: '주찬',
  side1: '부찬 1',
  side2: '부찬 2',
  kimchi: '김치',
  dessert: '후식',
};

export const EMPTY_MENU: Menu = Object.freeze({
  rice: '',
  soup: '',
  main: '',
  side1: '',
  side2: '',
  kimchi: '',
  dessert: '',
});

export interface PlannedDay {
  menu: Menu;
  note: string;
  noSchool: boolean;
}

export type PlanDays = Record<string, PlannedDay>;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_DAYS = 3660;
const MAX_NAME_LENGTH = 120;
const MAX_NOTE_LENGTH = 500;

function dateFromKey(value: string): Date {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid local date: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0) throw new Error(`Invalid local date: ${value}`);

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  // Date treats years 0..99 as 1900..1999 unless corrected explicitly.
  if (year < 100) date.setFullYear(year);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid local date: ${value}`);
  }
  return date;
}

export function localDateKey(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new Error('Invalid date');
  const year = date.getFullYear();
  if (year < 1 || year > 9999) throw new Error('Date year must be between 0001 and 9999');
  return `${String(year).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function weekDates(anchor: string): string[] {
  const monday = dateFromKey(anchor);
  const weekday = monday.getDay();
  monday.setDate(monday.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return Array.from({ length: 5 }, (_, offset) => {
    const date = new Date(monday.getTime());
    date.setDate(monday.getDate() + offset);
    return localDateKey(date);
  });
}

export function shiftWeek(anchor: string, amount: number): string {
  if (!Number.isSafeInteger(amount)) throw new Error('Week shift must be a finite integer');
  const mondayKey = weekDates(anchor)[0];
  const monday = dateFromKey(mondayKey);
  monday.setDate(monday.getDate() + amount * 7);
  return localDateKey(monday);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isMenu(value: unknown): value is Menu {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== SLOT_KEYS.length || keys.some((key) => !SLOT_KEYS.includes(key as keyof Menu))) return false;
  return SLOT_KEYS.every((key) => typeof value[key] === 'string' && value[key].length <= MAX_NAME_LENGTH);
}

function cloneMenu(menu: Menu): Menu {
  return Object.fromEntries(SLOT_KEYS.map((key) => [key, menu[key]])) as unknown as Menu;
}

export function parsePlanDays(value: unknown): PlanDays {
  if (!isRecord(value)) throw new Error('Plan days must be an object');
  const entries = Object.entries(value);
  if (entries.length > MAX_DAYS) throw new Error(`Plan days cannot exceed ${MAX_DAYS}`);

  const parsed: PlanDays = {};
  for (const [dateKey, rawDay] of entries) {
    dateFromKey(dateKey);
    if (!isRecord(rawDay)) throw new Error(`Invalid planned day: ${dateKey}`);
    const keys = Object.keys(rawDay);
    if (keys.length !== 3 || !['menu', 'note', 'noSchool'].every((key) => keys.includes(key))) {
      throw new Error(`Invalid planned day shape: ${dateKey}`);
    }
    if (!isMenu(rawDay.menu)) throw new Error(`Invalid menu: ${dateKey}`);
    if (typeof rawDay.note !== 'string' || rawDay.note.length > MAX_NOTE_LENGTH) {
      throw new Error(`Invalid note: ${dateKey}`);
    }
    if (typeof rawDay.noSchool !== 'boolean') throw new Error(`Invalid no-school flag: ${dateKey}`);
    parsed[dateKey] = { menu: cloneMenu(rawDay.menu), note: rawDay.note, noSchool: rawDay.noSchool };
  }
  return parsed;
}

function safeSpreadsheetValue(value: string): string {
  return /^\s*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string): string {
  const safe = safeSpreadsheetValue(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function weekCsv(dates: string[], days: PlanDays): string {
  const validatedDays = parsePlanDays(days);
  const header = ['날짜', ...SLOT_KEYS.map((key) => SLOT_LABELS[key]), '메모', '급식 없음'];
  const rows = dates.map((dateKey) => {
    dateFromKey(dateKey);
    const day = validatedDays[dateKey];
    const menuCells = SLOT_KEYS.map((key) => (day && !day.noSchool ? day.menu[key] : ''));
    return [dateKey, ...menuCells, day?.note ?? '', day?.noSchool ? '예' : ''].map(csvCell).join(',');
  });
  return `\uFEFF${[header.join(','), ...rows].join('\r\n')}`;
}

export function repeatNames(dates: string[], days: PlanDays): string[] {
  const validatedDays = parsePlanDays(days);
  const activeDateSets = new Map<string, Set<string>>();
  const encounterOrder: string[] = [];

  for (const dateKey of dates) {
    dateFromKey(dateKey);
    const day = validatedDays[dateKey];
    if (!day || day.noSchool) continue;
    const namesOnDay = new Set(SLOT_KEYS.map((key) => day.menu[key]).filter((name) => name.length > 0));
    for (const name of namesOnDay) {
      if (!activeDateSets.has(name)) {
        activeDateSets.set(name, new Set());
        encounterOrder.push(name);
      }
      activeDateSets.get(name)!.add(dateKey);
    }
  }

  return encounterOrder.filter((name) => activeDateSets.get(name)!.size > 1);
}

export function parseBackup(text: string): { version: 1; days: PlanDays } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Backup must be valid JSON');
  }
  if (!isRecord(value) || Object.keys(value).length !== 2 || value.version !== 1 || !Object.hasOwn(value, 'days')) {
    throw new Error('Backup must be an exact version 1 envelope');
  }
  return { version: 1, days: parsePlanDays(value.days) };
}

export function createBackup(days: PlanDays): string {
  return JSON.stringify({ version: 1, days: parsePlanDays(days) });
}
