'use client';

import { RefObject } from 'react';
import { getMenuItemByName, itemMatchesFilters, MenuFilters } from '@/lib/menuCatalog';
import type { Menu, LockedState } from '@/lib/menuGenerator';
import { SLOT_KEYS, SLOT_LABELS } from '@/lib/planner';

interface Props {menu:Menu;locked:LockedState;filters:MenuFilters;excluded:string[];onPick:(key:keyof Menu)=>void;onLock:(key:keyof Menu)=>void;onRefresh:(key:keyof Menu)=>void;onExclude:(key:keyof Menu)=>void;captureRef:RefObject<HTMLDivElement|null>;}
export default function MealEditor({menu,locked,filters,excluded,onPick,onLock,onRefresh,onExclude,captureRef}:Props){
  return <div ref={captureRef} className="meal-sheet">
    <div className="sheet-heading"><h2>식단 초안</h2><span className="muted small" data-html2canvas-ignore="true">메뉴 이름을 누르면 직접 바꿀 수 있어요</span></div>
    <div className="meal-grid">{SLOT_KEYS.map(key=>{
      const item=getMenuItemByName(menu[key]);
      const conflict=!!item&&(!itemMatchesFilters(item,filters)||excluded.includes(item.name));
      return <section className={`meal-row ${locked[key]?'is-locked':''}`} data-testid={`slot-${key}`} key={key}>
        <div className="meal-label">{SLOT_LABELS[key]}{locked[key]&&<span className="badge">고정됨</span>}</div>
        <button className="meal-name" aria-label={`${SLOT_LABELS[key]} 메뉴 선택`} onClick={()=>onPick(key)}>{menu[key]||'메뉴 선택'}<span aria-hidden="true" data-html2canvas-ignore="true" className="choose-arrow">⌄</span></button>
        {!menu[key]&&<p className="small notice">추천 후보가 없어요. 조건을 풀거나 직접 선택해 주세요.</p>}
        {menu[key]&&!item&&<p className="small muted">직접 입력 · 재료 정보 미확인</p>}
        {conflict&&<p className="small notice">추천 조건과 다릅니다. 고정·직접 선택한 메뉴를 확인해 주세요.</p>}
        <div className="slot-actions" data-html2canvas-ignore="true">
          <button className="text-button" aria-label={`${SLOT_LABELS[key]} ${locked[key]?'고정 해제':'고정'}`} aria-pressed={locked[key]} disabled={!menu[key]} onClick={()=>onLock(key)}>{locked[key]?'고정 해제':'고정'}</button>
          <button className="text-button" aria-label={`${SLOT_LABELS[key]} 다른 메뉴 추천`} disabled={locked[key]} onClick={()=>onRefresh(key)}>다른 메뉴</button>
          <button className="text-button danger" aria-label={`${SLOT_LABELS[key]} 추천에서 제외`} disabled={!menu[key]||locked[key]} onClick={()=>onExclude(key)}>제외</button>
        </div>
      </section>;
    })}</div>
    <p className="sheet-footnote">식단 아이디어 초안입니다. 실제 제공 전 영양·알레르기·조리 조건을 확인해 주세요.</p>
  </div>;
}
