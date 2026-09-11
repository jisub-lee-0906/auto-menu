'use client';

import { useEffect, useRef, useState } from 'react';
import MealEditor from '@/components/MealEditor';
import MenuPicker from '@/components/MenuPicker';
import WeekPlanner from '@/components/WeekPlanner';
import { DEFAULT_MENU_FILTERS, getMenuItemByName, itemMatchesFilters, type MenuFilters } from '@/lib/menuCatalog';
import { generateMenu, type Menu } from '@/lib/menuGenerator';
import { createBackup, localDateKey, parseBackup, SLOT_KEYS, SLOT_LABELS, weekCsv, weekDates } from '@/lib/planner';
import { EMPTY_LOCKS, initialWorkspace, menuKey, parseMenus, parseNames, parseWorkspace, withMenu, WORKSPACE_KEY, type Workspace } from '@/lib/workspace';

const FILTERS: { key: keyof MenuFilters; label: string }[] = [
  { key: 'excludeSpicy', label: '매운 메뉴 제외' },
  { key: 'excludeSeafood', label: '해산물 메뉴 제외' },
  { key: 'excludeDairy', label: '유제품 메뉴 제외' },
  { key: 'preferKorean', label: '한식 우선 추천' },
];

function download(content: string | Blob, filename: string, type = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function Home() {
  const [state, setState] = useState<Workspace | null>(null);
  const [tab, setTab] = useState<'meal' | 'week'>('meal');
  const [anchor, setAnchor] = useState('');
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [picker, setPicker] = useState<keyof Menu | null>(null);
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const undo = useRef<Workspace[]>([]);
  const captureRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = useRef<Workspace | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const initial = initialWorkspace(generateMenu());
      let loaded = initial;
      try {
        const stored = localStorage.getItem(WORKSPACE_KEY);
        if (stored !== null) loaded = parseWorkspace(stored);
        else {
          // Migrate without deleting or rewriting any legacy keys.
          const favorites = localStorage.getItem('auto-menu-favorites');
          const history = localStorage.getItem('auto-menu-history');
          const excluded = localStorage.getItem('auto-menu-excluded');
          loaded = {
            ...initial,
            favorites: favorites ? parseMenus(JSON.parse(favorites)) : [],
            history: history ? parseMenus(JSON.parse(history)) : [],
            excluded: excluded ? parseNames(JSON.parse(excluded)) : [],
          };
          loaded.menu = generateMenu(undefined, undefined, loaded.filters, loaded.excluded);
          localStorage.setItem(WORKSPACE_KEY, JSON.stringify(loaded));
        }
      } catch {
        setStorageBlocked(true);
        setSaveError('저장 데이터를 읽거나 쓸 수 없어 자동 저장을 중단했어요. 기존 데이터는 덮어쓰지 않았습니다.');
      }
      latest.current = loaded;
      setState(loaded);
      setAnchor(localDateKey(new Date()));
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === WORKSPACE_KEY || event.key === null) {
        setStorageBlocked(true);
        setSaveError('다른 탭에서 저장 데이터가 바뀌었어요. 현재 주간표를 백업한 뒤 새로고침해 주세요. 이 탭의 자동 저장은 중단했습니다.');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('storage', onStorage); };
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!saveError) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [saveError]);

  function commit(next: Workspace, recordUndo = true) {
    const serialized = JSON.stringify(next);
    try { parseWorkspace(serialized); }
    catch {
      setMessage('저장 가능한 범위를 넘었거나 형식이 맞지 않아 변경하지 않았어요. 주간표는 최대 3,660일, 즐겨찾기는 2,000개까지 저장할 수 있어요.');
      return false;
    }
    if (recordUndo && latest.current) undo.current = [...undo.current.slice(-19), latest.current];
    latest.current = next;
    setState(next);
    if (storageBlocked) return true;
    try {
      localStorage.setItem(WORKSPACE_KEY, serialized);
      setSaveError('');
    } catch {
      setSaveError('브라우저에 저장하지 못했어요. 저장 공간을 확인하고 주간표를 백업해 주세요. 현재 변경은 화면에만 남아 있습니다.');
    }
    return true;
  }

  if (!state) return <main className="app-shell"><h1>오늘의 급식</h1><p role="status">식단 작업 공간을 준비하고 있어요.</p></main>;

  const active = state;
  const hasMeal = Object.values(active.menu).some(Boolean);
  const favorite = active.favorites.some(item => menuKey(item) === menuKey(active.menu));

  function recommend(key?: keyof Menu) {
    const locks = key ? { ...EMPTY_LOCKS, ...Object.fromEntries(SLOT_KEYS.map(slot => [slot, slot !== key])) } : active.locked;
    const next = generateMenu(active.menu, locks, active.filters, active.excluded);
    if (!commit(withMenu(active, next))) return;
    setMessage(menuKey(next) === menuKey(active.menu) ? '바뀔 수 있는 다른 후보가 없어요. 고정 또는 추천 조건을 확인해 주세요.' : '식단 초안을 바꿨어요. 되돌리기로 이전 조합을 복원할 수 있어요.');
  }

  function applyFilter(key: keyof MenuFilters) {
    const filters = { ...active.filters, [key]: !active.filters[key] };
    const conflicts = SLOT_KEYS.filter(slot => {
      const item = getMenuItemByName(active.menu[slot]);
      return active.locked[slot] && item && !itemMatchesFilters(item, filters);
    });
    commit({ ...active, filters });
    setMessage(conflicts.length ? '조건을 바꿨어요. 조건과 다른 고정 메뉴는 표시했으니 확인해 주세요.' : '추천 조건을 바꿨어요. 현재 초안은 유지되며, 다음 추천부터 적용됩니다.');
  }

  function assign(date: string) {
    const previous = active.days[date];
    if (previous?.noSchool) { setMessage('급식 없는 날은 먼저 체크를 해제해 주세요.'); return; }
    if (previous && Object.values(previous.menu).some(Boolean) && !window.confirm(`${date} 식단을 현재 초안으로 교체할까요? 되돌리기로 복원할 수 있어요.`)) return;
    if (!commit({ ...active, days: { ...active.days, [date]: { menu: { ...active.menu }, note: previous?.note ?? '', noSchool: false } } })) return;
    setMessage(`${date}에 식단을 담았어요.`);
  }

  function loadMenu(menu: Menu, date: string | null = null) {
    if (!commit(withMenu({ ...active, locked: { ...EMPTY_LOCKS } }, { ...menu }))) return;
    setEditingDate(date);
    setTab('meal');
    setMessage(date ? '초안으로 불러왔어요. 수정 후 날짜에 저장을 눌러 반영해 주세요.' : '초안으로 불러왔어요. 현재 추천 조건과 다른 메뉴는 확인해 주세요.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveImage() {
    if (!captureRef.current || imageBusy) return;
    setImageBusy(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(captureRef.current, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('No image');
      download(blob, `식단초안-${localDateKey(new Date())}.png`);
      setMessage('이미지 파일 다운로드를 시작했어요.');
    } catch { setMessage('이미지를 만들지 못했어요. 텍스트 복사를 이용하거나 다시 시도해 주세요.'); }
    finally { setImageBusy(false); }
  }

  async function importFile(file: File) {
    try {
      if (file.size > 10_000_000) throw new Error('백업은 10MB 이하 파일만 불러올 수 있어요.');
      const parsed = parseBackup(await file.text());
      if (!window.confirm('모든 날짜의 주간 식단을 백업 내용으로 교체할까요? 현재 초안과 즐겨찾기는 유지됩니다.')) return;
      const current = latest.current;
      if (!current) return;
      if (!commit({ ...current, days: parsed.days })) return;
      setMessage('주간 식단 백업을 불러왔어요. 되돌리기로 취소할 수 있어요.');
    } catch { setMessage('백업을 불러오지 못했어요. 이 앱에서 저장한 10MB 이하 주간표 백업(JSON)을 선택해 주세요.'); }
  }

  return <div className="app-shell">
    <header className="app-header"><div><span className="eyebrow">영양교사를 위한 식단 아이디어</span><h1>오늘의 급식</h1><p className="tagline">영양은 든든하게, 식단은 정교하게</p></div><span className={`save-status ${saveError ? 'unsaved' : ''}`} role="status">{saveError ? '저장 주의' : '이 브라우저에 저장됨'}</span></header>
    {saveError && <section className="storage-warning" role="alert"><p>{saveError}</p><p className="small">주간표 백업은 아래 ‘저장과 백업’에서 내려받을 수 있어요.</p>{storageBlocked && <div className="button-row"><button className="button" onClick={() => { try { const keys = [WORKSPACE_KEY, 'auto-menu-history', 'auto-menu-favorites', 'auto-menu-excluded']; download(JSON.stringify(Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), null, 2), '저장값-원본보관.json', 'application/json'); } catch { setMessage('브라우저 저장소에 접근할 수 없어요. 현재 주간표 백업을 이용해 주세요.'); } }}>기존 저장값 보관</button><button className="button" onClick={() => { if (!window.confirm('기존 저장값을 보관했나요? 이 브라우저의 새 작업 공간을 현재 화면 내용으로 덮어씁니다.')) return; try { localStorage.setItem(WORKSPACE_KEY, JSON.stringify(active)); setStorageBlocked(false); setSaveError(''); } catch { setMessage('아직 저장할 수 없어요. 브라우저 저장 공간을 확인해 주세요.'); } }}>현재 내용으로 저장 재개</button></div>}</section>}
    <nav className="view-switch" aria-label="작업 화면"><button aria-pressed={tab === 'meal'} onClick={() => setTab('meal')}>한 끼 만들기</button><button aria-pressed={tab === 'week'} onClick={() => setTab('week')}>주간 식단</button></nav>
    <main>
      <div className="workspace-toolbar"><p className="muted small">{tab === 'meal' ? '추천받고 → 메뉴를 고치고 → 주간표에 담아 보세요.' : '날짜별 식단을 모아 보고 수정하세요.'}</p><button className="button subtle" disabled={!undo.current.length} onClick={() => { const previous = undo.current.pop(); if (previous) { commit(previous, false); setMessage('이전 변경으로 되돌렸어요.'); } }}>되돌리기</button></div>
      {tab === 'meal' ? <>
        {editingDate && <div className="editing-banner"><span>{editingDate} 식단을 초안에서 편집 중</span><button className="button" onClick={() => assign(editingDate)}>이 날짜에 수정 저장</button><button className="text-button" onClick={() => setEditingDate(null)}>연결 해제</button></div>}
        <div className="primary-actions"><button className="button primary" onClick={() => recommend()} disabled={SLOT_KEYS.every(key => active.locked[key])}>고정하지 않은 메뉴 추천</button><button className="button" onClick={() => setTab('week')}>주간표에 담기 →</button></div>
        <details className="conditions"><summary>추천 조건 <span className="muted small">{FILTERS.filter(option => active.filters[option.key]).length ? `${FILTERS.filter(option => active.filters[option.key]).length}개 적용` : '필요할 때만 설정하세요'}</span></summary><div className="filter-options">{FILTERS.map(option => <label key={option.key} className="filter-option"><input type="checkbox" checked={active.filters[option.key]} onChange={() => applyFilter(option.key)} />{option.label}</label>)}</div><p className="muted small">메뉴 이름·통상적인 음식 구성에 따른 추천 힌트이며 실제 원재료표는 아닙니다. 소스·육수·제품별 차이와 알레르기 안전을 보장하지 않습니다. 조건을 바꿔도 현재 초안과 고정은 유지됩니다.</p><button className="text-button" onClick={() => { commit({ ...active, filters: { ...DEFAULT_MENU_FILTERS } }); setMessage('추천 조건을 초기화했어요. 현재 초안은 유지됩니다.'); }}>조건 초기화</button></details>
        <MealEditor menu={active.menu} locked={active.locked} filters={active.filters} excluded={active.excluded} captureRef={captureRef} onPick={setPicker} onLock={key => commit({ ...active, locked: { ...active.locked, [key]: !active.locked[key] } })} onRefresh={recommend} onExclude={key => { const name = active.menu[key]; const excluded = [...new Set([...active.excluded, name])]; const locks = Object.fromEntries(SLOT_KEYS.map(slot => [slot, slot !== key])) as typeof active.locked; commit(withMenu({ ...active, excluded }, generateMenu(active.menu, locks, active.filters, excluded))); setMessage(`${name}을 추천에서 제외했어요. 되돌리기로 취소할 수 있어요.`); }} />
        <div className="export-actions"><button className="button" aria-pressed={favorite} disabled={!hasMeal} onClick={() => { if (!commit({ ...active, favorites: favorite ? active.favorites.filter(item => menuKey(item) !== menuKey(active.menu)) : [...active.favorites, { ...active.menu }] })) return; setMessage(favorite ? '즐겨찾기에서 해제했어요.' : '즐겨찾기에 담았어요.'); }}>{favorite ? '즐겨찾기 해제' : '즐겨찾기 저장'}</button><button className="button" disabled={!hasMeal} onClick={async () => { try { await navigator.clipboard.writeText(`[오늘의 급식 · 식단 초안]\n${SLOT_KEYS.map(key => `${SLOT_LABELS[key]}: ${active.menu[key] || '미정'}`).join('\n')}`); setMessage('식단 텍스트를 복사했어요.'); } catch { setMessage('복사 권한이 없어요. 이미지 또는 주간표 저장을 이용해 주세요.'); } }}>텍스트 복사</button><button className="button" disabled={imageBusy || !hasMeal} onClick={saveImage}>{imageBusy ? '이미지 만드는 중…' : '이미지 저장'}</button></div>
      </> : <WeekPlanner anchor={anchor} days={active.days} hasMeal={hasMeal} onAnchor={setAnchor} onAssign={assign} onEdit={date => loadMenu(active.days[date].menu, date)} onChange={(date, day) => commit({ ...active, days: { ...active.days, [date]: day } })} onCsv={() => { download(weekCsv(weekDates(anchor), active.days), `주간식단-${weekDates(anchor)[0]}.csv`, 'text/csv;charset=utf-8'); setMessage('주간표 CSV 다운로드를 시작했어요.'); }} />}
      <details className="library"><summary>보관함 <span className="muted small">즐겨찾기 {active.favorites.length} · 최근 초안 · 제외 메뉴</span></summary><h3>즐겨찾기</h3>{!active.favorites.length && <p className="muted small">마음에 드는 초안을 즐겨찾기에 담아 두세요.</p>}<div className="saved-grid">{active.favorites.map(item => <div className="saved-item" key={menuKey(item)}><button onClick={() => loadMenu(item)}><strong>{item.main || '주찬 미정'}</strong><span>{item.rice} / {item.soup}</span></button><button className="text-button danger" aria-label={`${item.main || '초안'} 즐겨찾기 삭제`} onClick={() => { commit({ ...active, favorites: active.favorites.filter(value => menuKey(value) !== menuKey(item)) }); setMessage('즐겨찾기를 삭제했어요. 되돌리기로 복원할 수 있어요.'); }}>삭제</button></div>)}</div><h3>최근 초안</h3><div className="saved-grid">{active.history.filter(item => menuKey(item) !== menuKey(active.menu)).map(item => <button className="saved-choice" key={menuKey(item)} onClick={() => loadMenu(item)}><strong>{item.main || '주찬 미정'}</strong><span>{item.rice} / {item.soup}</span></button>)}</div><h3>추천에서 제외한 메뉴</h3><p className="muted small">누르면 제외를 해제합니다. 이미 저장한 식단은 바꾸지 않아요.</p><div className="excluded-list">{active.excluded.map(name => <button className="button small" key={name} onClick={() => { commit({ ...active, excluded: active.excluded.filter(value => value !== name) }); setMessage(`${name} 제외를 해제했어요.`); }}>{name} · 해제</button>)}</div></details>
      <details className="backup-tools"><summary>저장과 백업</summary><p className="muted small">초안·즐겨찾기·주간표는 이 브라우저에만 저장돼요. 아래 백업은 모든 날짜의 주간표와 메모를 담으며, 다른 기기에서 불러올 수 있어요.</p><div className="button-row"><button className="button" onClick={() => download(createBackup(active.days), `주간식단-백업-${localDateKey(new Date())}.json`, 'application/json')}>주간표 백업 저장</button><button className="button" onClick={() => fileRef.current?.click()}>주간표 백업 불러오기</button><input ref={fileRef} type="file" accept=".json,application/json" className="visually-hidden" aria-label="주간표 백업 파일" onChange={event => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ''; }} /></div></details>
    </main>
    <footer className="app-footer"><p>식단 아이디어를 돕는 도구입니다. 실제 급식 제공 전 영양·알레르기·조리 조건을 검토해 주세요.</p><p>Dev 이지섭 · Data 문채영</p></footer>
    <div className="toast-container" aria-live="polite" aria-atomic="true">{message && <div className="app-toast">{message}</div>}</div>
    {picker && <MenuPicker slot={picker} filters={active.filters} excluded={active.excluded} onClose={() => setPicker(null)} onSelect={name => { commit(withMenu(active, { ...active.menu, [picker]: name })); setPicker(null); setMessage('선택한 메뉴로 바꿨어요. 유지하려면 고정을 눌러 주세요.'); }} />}
  </div>;
}
