'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ExcludedMenus from '@/components/ExcludedMenus';
import FavoriteMenus from '@/components/FavoriteMenus';
import MenuFilters from '@/components/MenuFilters';
import MenuSearch from '@/components/MenuSearch';
import MenuTray from '@/components/MenuTray';
import RecentMenus from '@/components/RecentMenus';
import Toast from '@/components/Toast';
import {
  DEFAULT_MENU_FILTERS,
  getMenuItemByName,
  itemMatchesFilters,
  MenuFilters as MenuFilterState,
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

function menuMatchesActiveConstraints(menu: Menu, filters: MenuFilterState, excludedNames: string[]): boolean {
  const names = [menu.rice, menu.soup, menu.main, menu.side1, menu.side2, menu.kimchi, menu.dessert];

  return names.every((name) => {
    if (excludedNames.includes(name)) return false;

    const item = getMenuItemByName(name);
    return !!item && itemMatchesFilters(item, filters);
  });
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
    if (!menuMatchesActiveConstraints(selectedMenu, filters, excludedNames)) {
      setLocked(INITIAL_LOCK_STATE);
      commitMenu(generateMenu(undefined, undefined, filters, excludedNames));
      showToast('현재 필터 또는 제외 메뉴와 맞지 않아 새 조합으로 다시 추천했습니다.');
      return;
    }

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

      <header className="pt-10 pb-4 px-5 sm:px-6 max-w-2xl mx-auto w-full flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-tighter text-[#191F28] leading-tight">오늘의 급식</h1>
          <p className="text-[#8B95A1] text-lg mt-1 tracking-tight">영양은 든든하게, 식단은 정교하게</p>
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

      <main className="flex-grow flex flex-col">
        <MenuFilters filters={filters} onChange={handleFiltersChange} />
        <ExcludedMenus items={excludedNames} onRemove={handleRemoveExcludedName} onClear={handleClearExcludedNames} />
        <FavoriteMenus items={favoriteMenus} onSelect={handleRestoreMenu} />
        <RecentMenus items={recentMenus.slice(1)} onSelect={handleRestoreMenu} />

        {menu ? (
          <div ref={trayRef} className="w-full max-w-2xl mx-auto px-5 sm:px-6 py-2">
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
            <span className="uppercase text-[10px] font-bold text-[#B0B8C1] tracking-wider">Dev</span>
            <span className="text-[#4E5968]">이지섭</span>
          </span>
          <span className="w-0.5 h-2.5 bg-[#E5E8EB] rounded-full"></span>
          <span className="flex items-center gap-1.5">
            <span className="uppercase text-[10px] font-bold text-[#B0B8C1] tracking-wider">Data</span>
            <span className="text-[#4E5968]">문채영</span>
          </span>
        </div>
      </footer>

      <div className="px-4 pt-4 pb-6 pointer-events-none md:fixed md:bottom-0 md:left-0 md:right-0 md:p-6 md:z-50">
        <div className="max-w-sm md:max-w-md mx-auto flex flex-col sm:flex-row items-stretch gap-3 pointer-events-auto transition-transform duration-500 ease-out transform translate-y-0">
          <button
            onClick={handleGenerateValues}
            disabled={isGenerating}
            className={`
              w-full sm:flex-grow flex items-center justify-center gap-2 py-4 px-6 rounded-[20px]
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

          <div className="grid grid-cols-3 sm:flex bg-white rounded-[20px] shadow-lg shadow-black/5 items-center p-1.5 gap-1">
            <button
              onClick={handleToggleFavorite}
              className={`h-12 sm:w-12 flex items-center justify-center rounded-[16px] transition-colors ${
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
            <div className="hidden sm:block w-px h-4 bg-[#E5E8EB]"></div>
            <button
              onClick={copyToClipboard}
              className="h-12 sm:w-12 flex items-center justify-center rounded-[16px] hover:bg-[#F2F4F6] text-[#4E5968] transition-colors"
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
            <div className="hidden sm:block w-px h-4 bg-[#E5E8EB]"></div>
            <button
              onClick={saveAsImage}
              className="h-12 sm:w-12 flex items-center justify-center rounded-[16px] hover:bg-[#F2F4F6] text-[#4E5968] transition-colors"
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
