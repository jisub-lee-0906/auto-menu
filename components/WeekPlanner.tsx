'use client';

import { EMPTY_MENU, PlanDays, PlannedDay, repeatNames, shiftWeek, SLOT_KEYS, SLOT_LABELS, weekDates } from '@/lib/planner';

interface Props {anchor:string;days:PlanDays;hasMeal:boolean;onAnchor:(date:string)=>void;onChange:(date:string,day:PlannedDay)=>void;onAssign:(date:string)=>void;onEdit:(date:string)=>void;onCsv:()=>void;}
const WEEKDAYS=['월','화','수','목','금'];
export default function WeekPlanner({anchor,days,hasMeal,onAnchor,onChange,onAssign,onEdit,onCsv}:Props){
  const dates=weekDates(anchor);
  const repeated=repeatNames(dates,days);
  const hasAny=dates.some(date=>!!days[date] && !days[date].noSchool && Object.values(days[date].menu).some(Boolean));
  return <section aria-labelledby="week-title" className="week-section">
    <div className="section-heading"><div><h2 id="week-title">주간 식단</h2><p className="muted">한 끼 초안을 날짜에 담고, 필요한 날만 고쳐 보세요.</p></div><button className="button" onClick={onCsv} disabled={!hasAny}>주간표 CSV 저장</button></div>
    <div className="week-navigation"><button className="button" onClick={()=>onAnchor(shiftWeek(anchor,-1))}>이전 주</button><label className="date-field">주간 선택<input type="date" min="1900-01-01" max="2099-12-31" value={anchor} onChange={e=>{if(e.target.value&&e.target.validity.valid)onAnchor(e.target.value);}}/></label><button className="button" onClick={()=>onAnchor(shiftWeek(anchor,1))}>다음 주</button></div>
    <p className="muted small week-range">{dates[0]} ~ {dates[4]} · CSV는 엑셀에서 열 수 있어요</p>
    {repeated.length>0&&<div className="notice repeat-notice" role="status">여러 날짜에 같은 메뉴가 있어요: {repeated.join(', ')}<span className="small"> 의도한 반복이라면 그대로 사용해도 됩니다.</span></div>}
    <div className="week-grid">{dates.map((date,index)=>{
      const day=days[date]??{menu:{...EMPTY_MENU},note:'',noSchool:false};
      const occupied=Object.values(day.menu).some(Boolean);
      return <article className={`day-card ${day.noSchool?'no-school':''}`} key={date} data-testid={`day-${index}`}>
        <div className="day-heading"><h3>{WEEKDAYS[index]}요일 <span>{date.slice(5).replace('-','/')}</span></h3><label className="checkbox-label"><input type="checkbox" checked={day.noSchool} onChange={e=>onChange(date,{...day,noSchool:e.target.checked})}/>급식 없음</label></div>
        {day.noSchool?<p className="empty">급식 없는 날<br/><span className="small">저장된 식단은 유지됩니다.</span></p>:<>
          {occupied?<dl className="day-menu">{SLOT_KEYS.map(key=><div key={key}><dt>{SLOT_LABELS[key]}</dt><dd>{day.menu[key]||'미정'}</dd></div>)}</dl>:<div className="empty">아직 식단이 없어요.<br/><span className="small">한 끼 초안을 만들어 담아 주세요.</span></div>}
          <div className="day-actions"><button className="button" disabled={!hasMeal} onClick={()=>onAssign(date)}>{occupied?'현재 초안으로 교체':'현재 초안 담기'}</button>{occupied&&<button className="button subtle" onClick={()=>onEdit(date)}>불러와 편집</button>}</div>
        </>}
        <label className="field-label note-label">메모<input aria-label={`${WEEKDAYS[index]}요일 메모`} maxLength={500} value={day.note} onChange={e=>onChange(date,{...day,note:e.target.value})} placeholder="예: 행사일, 특식"/></label>
      </article>;
    })}</div>
    <p className="muted small">메뉴 이름이 정확히 같은 반복을 안내합니다. 유사 메뉴·영양 균형까지 판정하지는 않습니다.</p>
  </section>;
}
