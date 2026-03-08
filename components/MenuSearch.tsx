'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { menuCatalog, MenuCategory } from '@/lib/menuCatalog';

interface MenuSearchProps {
  onClose: () => void;
}

const CATEGORY_NAMES: Record<MenuCategory, string> = {
  rice: '밥',
  soup: '국/찌개',
  main: '메인 반찬',
  side: '반찬',
  kimchi: '김치',
  dessert: '후식',
};

export default function MenuSearch({ onClose }: MenuSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    return (Object.keys(menuCatalog) as MenuCategory[]).reduce<{ category: MenuCategory; items: string[] }[]>(
      (acc, category) => {
        const items = menuCatalog[category]
          .filter((item) => {
            const searchable = [item.name, ...item.tags].join(' ').toLowerCase();
            return searchable.includes(term);
          })
          .map((item) => item.name);
        if (items.length > 0) {
          acc.push({ category, items });
        }
        return acc;
      },
      []
    );
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Input */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-grow text-lg placeholder-gray-400 outline-none text-gray-800"
            placeholder="메뉴 검색 (예: 미역국, 제육)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto flex-grow bg-gray-50/50 p-2">
          {searchTerm && results.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((group) => (
                <div key={group.category} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100/50">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    {CATEGORY_NAMES[group.category]}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {group.items.map((item, idx) => (
                      <div key={`${group.category}-${idx}`} className="text-gray-700 font-medium py-1 px-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors cursor-default">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!searchTerm && (
             <div className="text-center py-12 text-gray-400 text-sm">
               원하시는 메뉴를 검색해보세요
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
