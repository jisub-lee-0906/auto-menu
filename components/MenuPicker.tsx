'use client';

import { useEffect, useRef, useState } from 'react';
import { getFilteredCategory, MenuFilters, getMenuItemByName } from '@/lib/menuCatalog';
import type { Menu } from '@/lib/menuGenerator';
import { SLOT_LABELS } from '@/lib/planner';

const CATEGORY = {rice:'rice',soup:'soup',main:'main',side1:'side',side2:'side',kimchi:'kimchi',dessert:'dessert'} as const;
interface Props { slot: keyof Menu; filters: MenuFilters; excluded: string[]; onSelect: (name:string)=>void; onClose:()=>void; }

export default function MenuPicker({slot,filters,excluded,onSelect,onClose}:Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query,setQuery]=useState('');
  useEffect(()=>{ const element=dialog.current; const previous=document.activeElement as HTMLElement|null; element?.showModal(); return ()=>{element?.close(); previous?.focus();}; },[]);
  const term=query.trim();
  const candidates=getFilteredCategory(CATEGORY[slot],filters).filter(item=>!excluded.includes(item.name) && (!term || [item.name,...item.tags].join(' ').toLocaleLowerCase().includes(term.toLocaleLowerCase())));
  const existing=term ? getMenuItemByName(term) : undefined;
  const exact=candidates.some(item=>item.name===term);
  // Exact matches must remain selectable even when broad searches are capped.
  const displayed=[...candidates].sort((left,right)=>Number(right.name===term)-Number(left.name===term)).slice(0,60);
  return <dialog ref={dialog} className="picker-dialog" aria-labelledby="picker-title" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)onClose();}}}>
    <div className="dialog-header"><h2 id="picker-title">{SLOT_LABELS[slot]} 메뉴 선택</h2><button className="button subtle" onClick={onClose} aria-label="메뉴 선택 닫기">닫기</button></div>
    <label className="field-label" htmlFor="menu-query">메뉴 검색 또는 직접 입력</label>
    <input autoFocus id="menu-query" value={query} maxLength={120} onChange={e=>setQuery(e.target.value)} placeholder="예: 미역국, 우리 학교 특별 메뉴" />
    <p className="muted small">현재 추천 조건과 제외 목록을 적용한 후보예요.</p>
    <div className="picker-results">
      {displayed.map(item=><button className="candidate" key={item.id} onClick={()=>onSelect(item.name)}><span>{item.name}</span><span className="muted small">선택</span></button>)}
      {!candidates.length && <p className="empty">조건에 맞는 메뉴가 없어요. 검색어·추천 조건을 바꾸거나 직접 입력해 주세요.</p>}
      {candidates.length>60&&<p className="muted small">후보가 많아요. 검색어를 입력하면 더 쉽게 찾을 수 있어요.</p>}
    </div>
    {term&&!exact&&<div className="custom-entry"><p>“{term}”</p>{existing ? <p className="notice small">등록된 메뉴이지만 이 칸의 분류 또는 현재 추천 조건과 맞지 않아요. 조건을 바꾸거나 다른 메뉴를 선택해 주세요.</p> : <><p className="muted small">직접 입력한 메뉴는 재료·매운맛 정보가 미확인이에요. 추천 조건에 맞는지 직접 확인해 주세요.</p><button className="button primary" onClick={()=>onSelect(term)}>직접 입력한 메뉴 사용</button></>}</div>}
  </dialog>;
}
