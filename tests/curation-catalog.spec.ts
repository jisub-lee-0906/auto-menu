import { expect, test } from '@playwright/test';
import { menuCatalog, getMenuItemByName } from '../lib/menuCatalog';
import curated from '../data/menu_curated.json';
import { validateCurated } from '../scripts/curated-catalog.mjs';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateProvenance } from '../scripts/curation-provenance.mjs';
import ledger from '../docs/data-curation-decisions.json';
const snapshot = readFileSync(path.join(process.cwd(), 'docs/menu-source-snapshot.json'), 'utf8');

test('원본 이름·ID·카테고리와 삭제 사유 연결의 변조를 거부한다', () => {
  expect(() => validateProvenance(curated, ledger, snapshot)).not.toThrow();
  expect(() => validateProvenance(changedSource(rows => { rows[0].name = '기존 ID로 발명한 메뉴'; }), ledger, snapshot)).toThrow(/Retained identity mismatch/);
  const renamedArchive = structuredClone(ledger);
  renamedArchive.decisions[0].name = '바뀐 출처 이름';
  expect(() => validateProvenance(curated, renamedArchive, snapshot)).toThrow(/Archived identity mismatch/);
  const wrongLink = structuredClone(ledger);
  wrongLink.decisions.find(d => d.reasonCode === 'duplicate-alias')!.duplicateOf = '우유';
  expect(() => validateProvenance(curated, wrongLink, snapshot)).toThrow(/Unreviewed duplicate link/);
  expect(() => validateProvenance(changedSource(rows => { rows.shift(); }), ledger, snapshot)).toThrow(/Unreviewed source change/);
  expect(() => validateProvenance(curated, ledger, `${snapshot} `)).toThrow(/snapshot hash mismatch/);
});

test('향미·조리법이 다른 항목을 잘못 합치지 않고 매운 음식 힌트를 보존한다', () => {
  const plain = getMenuItemByName('무쌈');
  const lemon = getMenuItemByName('레몬무쌈');
  expect(plain).toBeDefined(); expect(lemon).toBeDefined();
  expect(plain?.id).not.toBe(lemon?.id);
  expect(getMenuItemByName('찐두부')?.cookingMethod).toBe('steamed');
  expect(getMenuItemByName('돌나물')).toBeUndefined();
  expect(getMenuItemByName('돌나물무침')?.cookingMethod).toBe('seasoned');
  for (const name of ['닭갈비', '오징어제육볶음', '김치치즈함박스테이크']) expect(getMenuItemByName(name)?.spicyLevel, name).toBeGreaterThan(0);
});

test('잘못된 검수 원본은 기존 생성 파일을 덮어쓰기 전에 빌드를 실패시킨다', () => {
  mkdirSync(path.join(process.cwd(), '.git/data-curation'), {recursive:true});
  const fixture = mkdtempSync(path.join(process.cwd(), '.git/data-curation/invalid-build-'));
  mkdirSync(path.join(fixture, 'scripts'));
  mkdirSync(path.join(fixture, 'data'));
  for (const name of ['build_menu_catalog.mjs', 'curated-catalog.mjs', 'curation-provenance.mjs']) copyFileSync(path.join('scripts', name), path.join(fixture, 'scripts', name));
  const invalid = changedSource(rows => { rows[0].protein = 'other'; });
  writeFileSync(path.join(fixture, 'data/menu_curated.json'), JSON.stringify(invalid));
  writeFileSync(path.join(fixture, 'data/menu_catalog.json'), 'unchanged-sentinel');
  const result = spawnSync(process.execPath, [path.join(fixture, 'scripts/build_menu_catalog.mjs')], {encoding:'utf8'});
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Unresolved or invalid metadata');
  expect(readFileSync(path.join(fixture, 'data/menu_catalog.json'), 'utf8')).toBe('unchanged-sentinel');
  mkdirSync(path.join(fixture, 'docs'));
  for (const name of ['data-curation-decisions.json', 'menu-source-snapshot.json']) copyFileSync(path.join('docs', name), path.join(fixture, 'docs', name));
  writeFileSync(path.join(fixture, 'data/menu_curated.json'), JSON.stringify(changedSource(rows => { rows[0].name = '출처 없는 새 이름'; })));
  const provenanceFailure = spawnSync(process.execPath, [path.join(fixture, 'scripts/build_menu_catalog.mjs')], {encoding:'utf8'});
  expect(provenanceFailure.status).toBe(1);
  expect(provenanceFailure.stderr).toContain('Retained identity mismatch');
  expect(readFileSync(path.join(fixture, 'data/menu_catalog.json'), 'utf8')).toBe('unchanged-sentinel');
});

function changedSource(change: (rows: typeof curated.items) => void) {
  const copy = structuredClone(curated);
  change(copy.items);
  return copy;
}

test('명시적 검수 원본과 실제 운영 데이터가 정확히 일치한다', () => {
  expect(validateCurated(curated)).toEqual(menuCatalog);
});

test('재빌드 전에 미확정 속성·중복·검수근거 누락을 차단한다', () => {
  expect(() => validateCurated(changedSource(rows => { rows[0].cookingMethod = 'other'; }))).toThrow(/Unresolved/);
  expect(() => validateCurated(changedSource(rows => { rows[0].reviewBasis = ''; }))).toThrow(/provenance/);
  expect(() => validateCurated(changedSource(rows => { rows.push(structuredClone(rows[0])); }))).toThrow(/Duplicate/);
  expect(() => validateCurated(changedSource(rows => { rows[0].tags.push('student-favorite'); }))).toThrow(/unsupported/);
});

test('음식 이름의 일부가 우연히 겹치는 해산물·유제품 오탐을 막는다', () => {
  expect(getMenuItemByName('둥굴레차')?.tags).not.toContain('seafood');
  expect(getMenuItemByName('크림슨포도')?.tags).not.toContain('dairy');
});

test('운영 카탈로그에는 미확정 속성이나 근거 없는 선호 태그를 남기지 않는다', () => {
  const items = Object.values(menuCatalog).flat();
  expect(items.filter(x => x.cookingMethod === 'other' || x.protein === 'other').map(x => x.name)).toEqual([]);
  expect(items.filter(x => x.tags.includes('student-favorite')).map(x => x.name)).toEqual([]);
});

test('브랜드·불완전 이름·후식 슬롯 오염 및 표기 중복을 운영 검색에서 제거한다', () => {
  for (const name of ['지코바치밥', '라이코펜밥', '과수원', '슈퍼볼', '스리라차', '클램차우더', '한국요구르트', '메론', '크로와상', '크로아상', '키위사과주스', '두부스틱', '청포묵', '고구마치즈스틱']) {
    expect(getMenuItemByName(name), name).toBeUndefined();
  }
  for (const name of ['백미밥', '멜론', '크루아상', '사과키위주스', '우유', '백김치']) {
    expect(getMenuItemByName(name), name).toBeDefined();
  }
});
