'use client';

import React from 'react';
import { LockedState, Menu } from '@/lib/menuGenerator';
import MenuSlot from './MenuSlot';

interface MenuTrayProps {
  menu: Menu;
  lockedState: LockedState;
  onToggleLock: (key: keyof Menu) => void;
  onRefreshItem: (key: keyof Menu) => void;
  onExcludeItem: (key: keyof Menu) => void;
}

export default function MenuTray({
  menu,
  lockedState,
  onToggleLock,
  onRefreshItem,
  onExcludeItem,
}: MenuTrayProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MenuSlot
            title="메인 반찬"
            menuItem={menu.main}
            isLocked={lockedState.main}
            onToggleLock={() => onToggleLock('main')}
            onRefresh={() => onRefreshItem('main')}
            onExclude={() => onExcludeItem('main')}
            className="lg:col-span-1 min-h-[172px]"
          />
          <MenuSlot
            title="서브 반찬"
            menuItem={menu.side1}
            isLocked={lockedState.side1}
            onToggleLock={() => onToggleLock('side1')}
            onRefresh={() => onRefreshItem('side1')}
            onExclude={() => onExcludeItem('side1')}
            className="min-h-[172px]"
          />
          <MenuSlot
            title="서브 반찬"
            menuItem={menu.side2}
            isLocked={lockedState.side2}
            onToggleLock={() => onToggleLock('side2')}
            onRefresh={() => onRefreshItem('side2')}
            onExclude={() => onExcludeItem('side2')}
            className="min-h-[172px]"
          />
          <MenuSlot
            title="김치"
            menuItem={menu.kimchi}
            isLocked={lockedState.kimchi}
            onToggleLock={() => onToggleLock('kimchi')}
            onRefresh={() => onRefreshItem('kimchi')}
            onExclude={() => onExcludeItem('kimchi')}
            className="min-h-[172px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MenuSlot
            title="밥"
            menuItem={menu.rice}
            isLocked={lockedState.rice}
            onToggleLock={() => onToggleLock('rice')}
            onRefresh={() => onRefreshItem('rice')}
            onExclude={() => onExcludeItem('rice')}
            className="min-h-[180px]"
          />
          <MenuSlot
            title="국 / 찌개"
            menuItem={menu.soup}
            isLocked={lockedState.soup}
            onToggleLock={() => onToggleLock('soup')}
            onRefresh={() => onRefreshItem('soup')}
            onExclude={() => onExcludeItem('soup')}
            className="min-h-[180px]"
          />
        </div>
      </div>

      <div className="w-full pt-2">
        <MenuSlot
          title="후식"
          menuItem={menu.dessert}
          isLocked={lockedState.dessert}
          onToggleLock={() => onToggleLock('dessert')}
          onRefresh={() => onRefreshItem('dessert')}
          onExclude={() => onExcludeItem('dessert')}
          className="min-h-[172px] bg-gradient-to-br from-white to-[#F9FAFB]"
        />
      </div>
    </div>
  );
}
