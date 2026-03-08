'use client';

import { Menu } from '@/lib/menuGenerator';

interface FavoriteMenusProps {
  items: Menu[];
  onSelect: (menu: Menu) => void;
}

function getMenuKey(menu: Menu): string {
  return [menu.rice, menu.soup, menu.main, menu.side1, menu.side2, menu.kimchi, menu.dessert].join('|');
}

export default function FavoriteMenus({ items, onSelect }: FavoriteMenusProps) {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-5 pb-3">
      <div className="rounded-[24px] bg-[#FFFDF4] border border-[#F6E7A8] shadow-[0_2px_12px_rgba(216,155,0,0.08)] p-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#191F28]">즐겨찾기</h2>
          <p className="mt-1 text-[13px] text-[#8B95A1]">다시 쓰고 싶은 조합을 따로 저장해둘 수 있습니다.</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={getMenuKey(item)}
              type="button"
              onClick={() => onSelect(item)}
              className="rounded-[18px] border border-[#F6E7A8] bg-white px-4 py-3 text-left transition-colors hover:bg-[#FFFBEA]"
            >
              <p className="text-[13px] font-semibold text-[#191F28]">{item.main}</p>
              <p className="mt-1 text-[12px] text-[#8B95A1]">
                {item.side1} · {item.side2}
              </p>
              <p className="mt-2 text-[11px] text-[#B0B8C1]">
                {item.rice} / {item.soup} / {item.dessert}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
