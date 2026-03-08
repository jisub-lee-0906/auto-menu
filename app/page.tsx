'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ExcludedMenus from '@/components/ExcludedMenus';
import FavoriteMenus from '@/components/FavoriteMenus';
import MenuFilters from '@/components/MenuFilters';
import MenuInsights from '@/components/MenuInsights';
import MenuSearch from '@/components/MenuSearch';
import MenuTray from '@/components/MenuTray';
import RecentMenus from '@/components/RecentMenus';
import Toast from '@/components/Toast';
import {
  DEFAULT_MENU_FILTERS,
  getMenuItemByName,
  MenuFilters as MenuFilterState,
  MenuItem,
} from '@/lib/menuCatalog';
import { generateMenu, LockedState, Menu } from '@/lib/menuGenerator';

const INITIAL_LOCK_STATE: LockedState = {
  rice: false,
  soup: false,
  main: false,
  side1: false,
  side2: false,
  kimchi: false,
  dessert: false,
};

const HISTORY_STORAGE_KEY = 'auto-menu-history';
const EXCLUDED_STORAGE_KEY = 'auto-menu-excluded';
const FAVORITES_STORAGE_KEY = 'auto-menu-favorites';
const HISTORY_LIMIT = 6;
const FAVORITES_LIMIT = 12;

function parseStoredMenus(value: string | null): Menu[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is Menu =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.rice === 'string' &&
        typeof item.soup === 'string' &&
        typeof item.main === 'string' &&
        typeof item.side1 === 'string' &&
        typeof item.side2 === 'string' &&
        typeof item.kimchi === 'string' &&
        typeof item.dessert === 'string'
    );
  } catch {
    return [];
  }
}

function parseStoredNames(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function menuEquals(left: Menu, right: Menu): boolean {
  return (
    left.rice === right.rice &&
    left.soup === right.soup &&
    left.main === right.main &&
    left.side1 === right.side1 &&
    left.side2 === right.side2 &&
    left.kimchi === right.kimchi &&
    left.dessert === right.dessert
  );
}

function getMenuKey(menu: Menu): string {
  return [menu.rice, menu.soup, menu.main, menu.side1, menu.side2, menu.kimchi, menu.dessert].join('|');
}

function badgeLabel(tag: string): string {
  const labels: Record<string, string> = {
    korean: '한식 위주',
    studentFavorite: '학생 선호',
    seafood: '해산물 포함',
    dairy: '유제품 포함',
    spicy: '매콤한 메뉴',
    fruit: '과일 후식',
    light: '가벼운 구성',
    hearty: '든든한 구성',
    grilled: '구이 메인',
    fried: '튀김 메인',
    soup: '국물 포함',
    vegetable: '채소 반찬',
  };

  return labels[tag] ?? tag;
}

function proteinSummary(item: MenuItem | undefined): string {
  if (!item) return '균형형';

  const labels: Record<MenuItem['protein'], string> = {
    grain: '곡물형',
    meat: '육류형',
    seafood: '해산물형',
    egg: '달걀형',
    tofu: '두부형',
    vegetable: '채소형',
    fruit: '과일형',
    dairy: '유제품형',
    mixed: '복합형',
    other: '균형형',
  };

  return labels[item.protein];
}

function buildMenuInsights(menu: Menu): {
  title: string;
  summary: string;
  description: string;
  details: string[];
  badges: string[];
} {
  const mainItem = getMenuItemByName(menu.main);
  const sideItems = [menu.side1, menu.side2].map(getMenuItemByName).filter(Boolean) as MenuItem[];
  const dessertItem = getMenuItemByName(menu.dessert);
  const soupItem = getMenuItemByName(menu.soup);

  const badges = new Set<string>();

  if (mainItem?.tags.includes('korean')) badges.add('korean');
  if (mainItem?.tags.includes('student-favorite')) badges.add('studentFavorite');
  if (mainItem?.protein === 'seafood' || mainItem?.tags.includes('seafood')) badges.add('seafood');
  if (dessertItem?.protein === 'dairy' || dessertItem?.tags.includes('dairy')) badges.add('dairy');
  if ((mainItem?.spicyLevel ?? 0) > 0 || sideItems.some((item) => item.spicyLevel > 0)) badges.add('spicy');
  if (dessertItem?.protein === 'fruit') badges.add('fruit');
  if (mainItem?.mealWeight === 'heavy') badges.add('hearty');
  if (sideItems.some((item) => item.protein === 'vegetable')) badges.add('vegetable');
  if (mainItem?.cookingMethod === 'grilled') badges.add('grilled');
  if (mainItem?.cookingMethod === 'fried') badges.add('fried');
  if (soupItem) badges.add('soup');
  if ((mainItem?.mealWeight ?? 'medium') === 'light' && sideItems.every((item) => item.mealWeight !== 'heavy')) {
    badges.add('light');
  }

  const cookingSummary: Record<MenuItem['cookingMethod'], string> = {
    rice: '밥 중심으로 무난하게 이어지는 조합입니다.',
    soup: '국물과 자연스럽게 맞물리는 구성입니다.',
    'stir-fry': '볶음 메인을 중심으로 익숙한 선호도를 노린 조합입니다.',
    fried: '메인이 강해서 반찬은 무겁지 않게 맞춘 조합입니다.',
    grilled: '구이 메인이라 급식 식판에 안정적으로 잘 들어맞습니다.',
    braised: '양념 메인에 반찬 대비를 준 구성입니다.',
    steamed: '자극이 세지 않아 편하게 먹기 좋은 조합입니다.',
    raw: '상대적으로 산뜻한 결이 살아 있는 조합입니다.',
    salad: '가벼운 흐름을 유지한 조합입니다.',
    noodle: '면류 특성을 해치지 않도록 곁들임을 눌러 잡은 조합입니다.',
    baked: '간식형 만족감을 살린 구성입니다.',
    dessert: '후식까지 자연스럽게 연결되는 구성입니다.',
    other: '메인과 반찬의 충돌을 줄인 무난한 조합입니다.',
  };

  const sideBalance = sideItems.some((item) => item.protein === 'vegetable')
    ? '반찬에는 채소 계열을 넣어 전체 무게를 눌렀습니다.'
    : '반찬은 메인과 조리법이 겹치지 않게 배치했습니다.';

  const dessertBalance =
    dessertItem?.protein === 'fruit'
      ? '후식은 과일 계열로 마무리해 식사 뒤 느낌이 가볍습니다.'
      : dessertItem?.protein === 'dairy'
        ? '후식은 유제품 계열이라 만족감을 더해줍니다.'
        : '후식까지 포함해 급식형 흐름이 자연스럽게 이어집니다.';

  const summary = `${proteinSummary(mainItem)} 메인 + ${
    sideItems.some((item) => item.protein === 'vegetable') ? '채소 반찬' : '균형 반찬'
  } + ${dessertItem?.protein === 'fruit' ? '가벼운 후식' : '마무리 후식'}`;

  return {
    title: mainItem ? `${menu.main} 중심 추천` : `${menu.main} 추천`,
    summary,
    description: mainItem ? cookingSummary[mainItem.cookingMethod] : '메인 반찬을 중심으로 무난하게 정리한 구성입니다.',
    details: [sideBalance, dessertBalance],
    badges: Array.from(badges).slice(0, 5).map(badgeLabel),
  };
}

export default function Home() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [locked, setLocked] = useState<LockedState>(INITIAL_LOCK_STATE);
  const [filters, setFilters] = useState<MenuFilterState>(DEFAULT_MENU_FILTERS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentMenus, setRecentMenus] = useState<Menu[]>([]);
  const [favoriteMenus, setFavoriteMenus] = useState<Menu[]>([]);
  const [excludedNames, setExcludedNames] = useState<string[]>([]);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const commitMenu = useCallback((nextMenu: Menu | null) => {
    setMenu(nextMenu);

    if (!nextMenu) return;

    setRecentMenus((prev) => {
      const deduped = prev.filter((item) => !menuEquals(item, nextMenu));
      return [nextMenu, ...deduped].slice(0, HISTORY_LIMIT);
    });
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2200);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRecentMenus(parseStoredMenus(window.localStorage.getItem(HISTORY_STORAGE_KEY)));
      setExcludedNames(parseStoredNames(window.localStorage.getItem(EXCLUDED_STORAGE_KEY)));
      setFavoriteMenus(parseStoredMenus(window.localStorage.getItem(FAVORITES_STORAGE_KEY)));
      setIsStorageReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isStorageReady) return;
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(recentMenus));
  }, [isStorageReady, recentMenus]);

  useEffect(() => {
    if (!isStorageReady) return;
    window.localStorage.setItem(EXCLUDED_STORAGE_KEY, JSON.stringify(excludedNames));
  }, [excludedNames, isStorageReady]);

  useEffect(() => {
    if (!isStorageReady) return;
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteMenus));
  }, [favoriteMenus, isStorageReady]);

  useEffect(() => {
    if (!isStorageReady || menu) return;

    const frame = window.requestAnimationFrame(() => {
      commitMenu(generateMenu(undefined, undefined, filters, excludedNames));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [commitMenu, excludedNames, filters, isStorageReady, menu]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const insights = useMemo(() => (menu ? buildMenuInsights(menu) : null), [menu]);
  const isCurrentFavorite = useMemo(
    () => (menu ? favoriteMenus.some((item) => menuEquals(item, menu)) : false),
    [favoriteMenus, menu]
  );

  const handleGenerateValues = useCallback(() => {
    if (isGenerating) return;

    setIsGenerating(true);
    window.setTimeout(() => {
      commitMenu(generateMenu(menu || undefined, locked, filters, excludedNames));
      setIsGenerating(false);
    }, 400);
  }, [commitMenu, excludedNames, filters, isGenerating, locked, menu]);

  const handleToggleLock = (key: keyof Menu) => {
    setLocked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRefreshItem = (key: keyof Menu) => {
    if (!menu) return;

    const tempLocked: LockedState = {
      rice: true,
      soup: true,
      main: true,
      side1: true,
      side2: true,
      kimchi: true,
      dessert: true,
      [key]: false,
    };

    commitMenu(generateMenu(menu, tempLocked, filters, excludedNames));
  };

  const handleExcludeItem = (key: keyof Menu) => {
    if (!menu?.[key]) return;

    const excludedName = menu[key];
    const nextExcludedNames = Array.from(new Set([...excludedNames, excludedName]));
    setExcludedNames(nextExcludedNames);
    showToast(`${excludedName} 메뉴를 제외 목록에 추가했습니다.`);

    const tempLocked: LockedState = {
      rice: true,
      soup: true,
      main: true,
      side1: true,
      side2: true,
      kimchi: true,
      dessert: true,
      [key]: false,
    };

    commitMenu(generateMenu(menu, tempLocked, filters, nextExcludedNames));
  };

  const handleFiltersChange = (nextFilters: MenuFilterState) => {
    setFilters(nextFilters);
    setLocked(INITIAL_LOCK_STATE);
    commitMenu(generateMenu(undefined, undefined, nextFilters, excludedNames));
  };

  const handleRestoreMenu = (selectedMenu: Menu) => {
    commitMenu(selectedMenu);
    setLocked(INITIAL_LOCK_STATE);
    showToast('저장된 조합을 다시 불러왔습니다.');
  };

  const handleToggleFavorite = () => {
    if (!menu) return;

    const menuKey = getMenuKey(menu);

    setFavoriteMenus((prev) => {
      const exists = prev.some((item) => getMenuKey(item) === menuKey);

      if (exists) {
        showToast('즐겨찾기에서 제거했습니다.');
        return prev.filter((item) => getMenuKey(item) !== menuKey);
      }

      showToast('즐겨찾기에 저장했습니다.');
      return [menu, ...prev.filter((item) => getMenuKey(item) !== menuKey)].slice(0, FAVORITES_LIMIT);
    });
  };

  const handleRemoveExcludedName = (name: string) => {
    setExcludedNames((prev) => prev.filter((item) => item !== name));
    showToast(`${name} 메뉴를 제외 목록에서 해제했습니다.`);
  };

  const handleClearExcludedNames = () => {
    if (excludedNames.length === 0) return;
    setExcludedNames([]);
    showToast('제외 메뉴를 모두 초기화했습니다.');
  };

  const copyToClipboard = () => {
    if (!menu) return;

    const text = `[오늘의 급식]
밥: ${menu.rice}
국: ${menu.soup}
메인: ${menu.main}
반찬: ${menu.side1}, ${menu.side2}
김치: ${menu.kimchi}
후식: ${menu.dessert}`;

    navigator.clipboard.writeText(text).then(
      () => showToast('식단 텍스트를 복사했습니다.'),
      () => showToast('복사에 실패했습니다.')
    );
  };

  const saveAsImage = async () => {
    if (!trayRef.current) return;

    try {
      const canvas = await html2canvas(trayRef.current, {
        scale: 2,
        backgroundColor: '#f5f5f4',
        logging: false,
        useCORS: true,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `오늘의급식-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
      showToast('이미지를 저장했습니다.');
    } catch (err) {
      console.error('Failed to save image:', err);
      showToast('이미지 저장에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#3182F6] selection:text-white pb-32">
      {toastMessage ? <Toast message={toastMessage} /> : null}

      <header className="pt-10 pb-4 px-6 max-w-2xl mx-auto w-full flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-tighter text-[#191F28] leading-tight">오늘의 급식</h1>
          <p className="text-[#8B95A1] text-lg mt-1 tracking-tight">영양사는 가볍게, 식단은 더 정교하게.</p>
        </div>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="mt-2 p-2.5 rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          title="메뉴 검색"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </header>

      {isSearchOpen ? <MenuSearch onClose={() => setIsSearchOpen(false)} /> : null}

      <main className="flex-grow px-5 flex flex-col">
        <MenuFilters filters={filters} onChange={handleFiltersChange} />
        <ExcludedMenus items={excludedNames} onRemove={handleRemoveExcludedName} onClear={handleClearExcludedNames} />
        {insights ? (
          <MenuInsights
            title={insights.title}
            summary={insights.summary}
            description={insights.description}
            details={insights.details}
            badges={insights.badges}
          />
        ) : null}
        <FavoriteMenus items={favoriteMenus} onSelect={handleRestoreMenu} />
        <RecentMenus items={recentMenus.slice(1)} onSelect={handleRestoreMenu} />

        {menu ? (
          <div ref={trayRef} className="w-full flex justify-center py-2">
            <MenuTray
              menu={menu}
              lockedState={locked}
              onToggleLock={handleToggleLock}
              onRefreshItem={handleRefreshItem}
              onExcludeItem={handleExcludeItem}
            />
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-[#B0B8C1] space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#E5E8EB] animate-pulse"></div>
            <p className="font-medium">맛있는 메뉴를 준비하고 있어요.</p>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-8 opacity-60 hover:opacity-100 transition-opacity duration-300">
        <div className="inline-flex items-center justify-center gap-3 text-[12px] font-medium text-[#8B95A1] tracking-tight">
          <span className="flex items-center gap-1.5">
            <span className="uppercase text-[10px] font-bold text-[#B0B8C1] tracking-wider">UI</span>
            <span className="text-[#4E5968]">Auto Menu App</span>
          </span>
          <span className="w-0.5 h-2.5 bg-[#E5E8EB] rounded-full"></span>
          <span className="flex items-center gap-1.5">
            <span className="uppercase text-[10px] font-bold text-[#B0B8C1] tracking-wider">Data</span>
            <span className="text-[#4E5968]">Menu Catalog</span>
          </span>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-md mx-auto flex items-stretch gap-3 pointer-events-auto transition-transform duration-500 ease-out transform translate-y-0">
          <button
            onClick={handleGenerateValues}
            disabled={isGenerating}
            className={`
              flex-grow flex items-center justify-center gap-2 py-4 px-6 rounded-[20px]
              text-white font-bold text-[17px] shadow-lg shadow-blue-500/30
              transition-all active:scale-[0.96] duration-200
              ${isGenerating ? 'bg-[#B0B8C1] cursor-not-allowed' : 'bg-[#3182F6] hover:bg-[#2C75DE]'}
            `}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white/90" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>생성 중</span>
              </span>
            ) : (
              <span>전체 다시 짜기</span>
            )}
          </button>

          <div className="flex bg-white rounded-[20px] shadow-lg shadow-black/5 items-center p-1.5 gap-1">
            <button
              onClick={handleToggleFavorite}
              className={`w-12 h-full flex items-center justify-center rounded-[16px] transition-colors ${
                isCurrentFavorite ? 'bg-[#FFF7D6] text-[#D89B00]' : 'hover:bg-[#F2F4F6] text-[#4E5968]'
              }`}
              title={isCurrentFavorite ? '즐겨찾기 해제' : '즐겨찾기 저장'}
            >
              <svg className="w-6 h-6" fill={isCurrentFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.2 3.69a1 1 0 00.95.69h3.878c.969 0 1.371 1.24.588 1.81l-3.138 2.28a1 1 0 00-.364 1.118l1.2 3.69c.3.921-.755 1.688-1.539 1.118l-3.138-2.28a1 1 0 00-1.176 0l-3.138 2.28c-.783.57-1.838-.197-1.539-1.118l1.2-3.69a1 1 0 00-.364-1.118L2.98 9.117c-.783-.57-.38-1.81.588-1.81h3.878a1 1 0 00.95-.69l1.2-3.69z"
                />
              </svg>
            </button>
            <div className="w-px h-4 bg-[#E5E8EB]"></div>
            <button
              onClick={copyToClipboard}
              className="w-12 h-full flex items-center justify-center rounded-[16px] hover:bg-[#F2F4F6] text-[#4E5968] transition-colors"
              title="텍스트로 복사"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            </button>
            <div className="w-px h-4 bg-[#E5E8EB]"></div>
            <button
              onClick={saveAsImage}
              className="w-12 h-full flex items-center justify-center rounded-[16px] hover:bg-[#F2F4F6] text-[#4E5968] transition-colors"
              title="이미지로 저장"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
