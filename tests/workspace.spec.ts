import { expect, test } from '@playwright/test';
import { EMPTY_MENU } from '@/lib/planner';
import { initialWorkspace, parseWorkspace, parseMenus, parseNames, withMenu } from '@/lib/workspace';

test('작업 공간이 모든 현재 필드와 사용자 메뉴를 보존한다',()=>{
 const menu={...EMPTY_MENU,main:'우리 학교 특별 메뉴'};
 const state=initialWorkspace(menu);
 state.favorites=[menu];state.excluded=['가라아게'];state.locked.main=true;
 state.days={'2026-09-14':{menu,note:'특식',noSchool:false}};
 expect(parseWorkspace(JSON.stringify(state))).toEqual(state);
});

test('잘못된 저장 버전, 잠금, 제외 목록, 날짜를 거부한다',()=>{
 const state=initialWorkspace({...EMPTY_MENU});
 for(const value of [{...state,version:2},{...state,locked:{}},{...state,filters:{}},{...state,excluded:[1]},{...state,days:{'2026-02-30':{menu:EMPTY_MENU,note:'',noSchool:false}}}]) {
  expect(()=>parseWorkspace(JSON.stringify(value))).toThrow();
 }
 expect(()=>parseWorkspace('not-json')).toThrow();
 expect(()=>parseMenus([{main:'불완전'}])).toThrow();
 expect(()=>parseNames(['x'.repeat(121)])).toThrow();
});

test('제외 이름 중복 제거, 최근 이력은 중복 없이 이전 객체를 보존한다',()=>{
 expect(parseNames(['김치','김치','국'])).toEqual(['김치','국']);
 const initial=initialWorkspace({...EMPTY_MENU,main:'처음'});
 const next=withMenu(initial,{...EMPTY_MENU,main:'새 초안'});
 const repeated=withMenu(next,{...EMPTY_MENU,main:'새 초안'});
 expect(initial.menu.main).toBe('처음');expect(initial.history).toEqual([]);
 expect(repeated.history).toHaveLength(1);
});
