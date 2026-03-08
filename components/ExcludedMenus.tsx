'use client';

interface ExcludedMenusProps {
  items: string[];
  onRemove: (name: string) => void;
  onClear: () => void;
}

export default function ExcludedMenus({ items, onRemove, onClear }: ExcludedMenusProps) {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-5 pb-3">
      <div className="rounded-[24px] bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#191F28]">제외 메뉴 {items.length}개</h2>
            <p className="mt-1 text-[13px] text-[#8B95A1]">원하지 않는 메뉴를 직접 관리할 수 있습니다.</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-[#F2F4F6] px-3 py-2 text-[12px] font-semibold text-[#4E5968] transition-colors hover:bg-[#E9EDF1]"
          >
            전체 초기화
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onRemove(item)}
              className="rounded-full border border-[#E5E8EB] bg-[#FAFBFC] px-3 py-2 text-[12px] font-medium text-[#4E5968] transition-colors hover:border-[#F97316] hover:text-[#F97316]"
            >
              {item} ×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
