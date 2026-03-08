'use client';

import { Menu } from '@/lib/menuGenerator';

interface RecentMenusProps {
  items: Menu[];
  onSelect: (menu: Menu) => void;
}

function getMenuKey(menu: Menu): string {
  return [menu.rice, menu.soup, menu.main, menu.side1, menu.side2, menu.kimchi, menu.dessert].join('|');
}

export default function RecentMenus({ items, onSelect }: RecentMenusProps) {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-5 pb-3">
      <div className="rounded-[24px] bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#191F28]">최근 조합</h2>
          <p className="mt-1 text-[13px] text-[#8B95A1]">방금 봤던 식단을 빠르게 다시 꺼낼 수 있습니다.</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={getMenuKey(item)}
              type="button"
              onClick={() => onSelect(item)}
              className="rounded-[18px] border border-gray-100 bg-[#FAFBFC] px-4 py-3 text-left transition-colors hover:border-[#DCE8FF] hover:bg-[#F7FAFF]"
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
