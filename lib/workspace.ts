import { DEFAULT_MENU_FILTERS, type MenuFilters } from '@/lib/menuCatalog';
import type { LockedState, Menu } from '@/lib/menuGenerator';
import { isMenu, parsePlanDays, PlanDays, SLOT_KEYS } from '@/lib/planner';

export const WORKSPACE_KEY='auto-menu-workspace-v1';
export const EMPTY_LOCKS:LockedState={rice:false,soup:false,main:false,side1:false,side2:false,kimchi:false,dessert:false};
export interface Workspace {version:1;menu:Menu;locked:LockedState;filters:MenuFilters;excluded:string[];favorites:Menu[];history:Menu[];days:PlanDays;}
export function initialWorkspace(menu:Menu):Workspace{return {version:1,menu,locked:{...EMPTY_LOCKS},filters:{...DEFAULT_MENU_FILTERS},excluded:[],favorites:[],history:[],days:{}};}
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
export function parseNames(value:unknown):string[]{if(!Array.isArray(value)||value.length>10000||!value.every(x=>typeof x==='string'&&x.length<=120))throw new Error('제외 목록 형식이 올바르지 않습니다.');return [...new Set(value)];}
export function parseMenus(value:unknown):Menu[]{if(!Array.isArray(value)||value.length>2000||!value.every(isMenu))throw new Error('저장된 식단 형식이 올바르지 않습니다.');return value;}
export function parseWorkspace(text:string):Workspace{
 const value:unknown=JSON.parse(text);
 if(!record(value)||value.version!==1||!isMenu(value.menu)||!record(value.locked)||!record(value.filters))throw new Error('저장 데이터 버전 또는 형식이 올바르지 않습니다.');
 const locked=value.locked,filters=value.filters;
 if(!SLOT_KEYS.every(key=>typeof locked[key]==='boolean')||!Object.keys(DEFAULT_MENU_FILTERS).every(key=>typeof filters[key]==='boolean'))throw new Error('저장된 추천 조건 형식이 올바르지 않습니다.');
 return {version:1,menu:value.menu,locked:Object.fromEntries(SLOT_KEYS.map(key=>[key,locked[key]])) as unknown as LockedState,filters:Object.fromEntries(Object.keys(DEFAULT_MENU_FILTERS).map(key=>[key,filters[key]])) as unknown as MenuFilters,excluded:parseNames(value.excluded),favorites:parseMenus(value.favorites),history:parseMenus(value.history),days:parsePlanDays(value.days)};
}
export function menuKey(menu:Menu):string{return JSON.stringify(SLOT_KEYS.map(key=>menu[key]));}
export function withMenu(state:Workspace,menu:Menu):Workspace{return {...state,menu,history:[menu,...state.history.filter(x=>menuKey(x)!==menuKey(menu))].slice(0,12)};}
