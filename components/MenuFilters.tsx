'use client';

import { DEFAULT_MENU_FILTERS } from '@/lib/menuCatalog';
import type { MenuFilters as MenuFilterState } from '@/lib/menuCatalog';

interface MenuFiltersProps {
  filters: MenuFilterState;
  onChange: (filters: MenuFilterState) => void;
}

const FILTER_OPTIONS: Array<{
  key: keyof MenuFilterState;
  label: string;
  description: string;
}> = [
  { key: 'excludeSpicy', label: '매운 메뉴 제외', description: '맵거나 자극적인 메뉴를 빼고 조합합니다.' },
  { key: 'excludeSeafood', label: '해산물 제외', description: '생선, 조개, 새우 같은 해산물 메뉴를 제외합니다.' },
  { key: 'excludeDairy', label: '유제품 제외', description: '우유, 요거트, 치즈 기반 메뉴를 제외합니다.' },
  { key: 'preferKorean', label: '한식 위주', description: '한식 느낌이 강한 메뉴를 우선 추천합니다.' },
];

export default function MenuFilters({ filters, onChange }: MenuFiltersProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-5 pb-3">
      <div className="rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#191F28]">추천 조건</h2>
            <p className="text-[13px] text-[#8B95A1] mt-1">조합 오차를 줄이기 위한 기본 필터입니다.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_MENU_FILTERS)}
            className="text-[12px] font-semibold text-[#3182F6] hover:text-[#2C75DE]"
          >
            초기화
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {FILTER_OPTIONS.map((option) => {
            const checked = filters[option.key];

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onChange({ ...filters, [option.key]: !checked })}
                className={`rounded-[18px] border px-4 py-3 text-left transition-colors ${
                  checked
                    ? 'border-[#3182F6] bg-[#EEF6FF]'
                    : 'border-gray-100 bg-[#FAFBFC] hover:border-[#D6E4FF]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[14px] font-semibold ${checked ? 'text-[#1D4ED8]' : 'text-[#191F28]'}`}>
                    {option.label}
                  </span>
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                      checked ? 'bg-[#3182F6] text-white' : 'bg-[#E5E8EB] text-[#8B95A1]'
                    }`}
                  >
                    {checked ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#8B95A1]">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
