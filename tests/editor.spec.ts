import { expect, test } from '@playwright/test';

test('메뉴를 직접 입력하고 고정한 뒤 되돌릴 수 있다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '오늘의 급식', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '주찬 메뉴 선택' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: '메뉴 검색 또는 직접 입력' }).fill('우리학교 특별볶음');
  await dialog.getByRole('button', { name: '직접 입력한 메뉴 사용' }).click();
  await expect(page.getByTestId('slot-main')).toContainText('우리학교 특별볶음');
  await expect(page.getByTestId('slot-main')).toContainText('직접 입력');
  await page.getByRole('button', { name: '주찬 고정', exact: true }).click();
  await page.getByRole('button', { name: '고정하지 않은 메뉴 추천' }).click();
  await expect(page.getByTestId('slot-main')).toContainText('우리학교 특별볶음');
  await page.getByRole('button', { name: '되돌리기', exact: true }).click();
  await expect(page.getByTestId('slot-main')).toContainText('우리학교 특별볶음');
});

test('주간 식단은 새로고침 후 유지되고 급식 없는 날을 되돌릴 수 있다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '주간 식단', exact: true }).click();
  const monday=page.getByTestId('day-0');
  await monday.getByRole('button', { name: '현재 초안 담기' }).click();
  await expect(monday.getByRole('button', { name: '불러와 편집' })).toBeVisible();
  await monday.getByRole('textbox', { name: '월요일 메모' }).fill('주간 테스트');
  await monday.getByRole('checkbox', { name: '급식 없음' }).check();
  await page.reload();
  await page.getByRole('button', { name: '주간 식단', exact: true }).click();
  await expect(monday.getByRole('checkbox', { name: '급식 없음' })).toBeChecked();
  await expect(monday.getByRole('textbox', { name: '월요일 메모' })).toHaveValue('주간 테스트');
  await monday.getByRole('checkbox', { name: '급식 없음' }).uncheck();
  await expect(monday.getByRole('button', { name: '불러와 편집' })).toBeVisible();
});


test('검색 선택, Esc 닫기, 고정 유지, 제외 취소', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button',{name:'주찬 메뉴 선택'}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('textbox').fill('간장제육볶음');
  await dialog.getByRole('button',{name:'간장제육볶음 선택',exact:true}).click();
  await expect(page.getByTestId('slot-main')).toContainText('간장제육볶음');
  await page.getByRole('button',{name:'주찬 고정',exact:true}).click();
  await page.locator('summary').filter({hasText:'추천 조건'}).click();
  await page.getByRole('checkbox',{name:'유제품 메뉴 제외'}).check();
  await expect(page.getByRole('button',{name:'주찬 고정 해제',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('slot-main')).toContainText('간장제육볶음');
  await page.getByRole('button',{name:'주찬 고정 해제',exact:true}).click();
  await page.getByRole('button',{name:'주찬 추천에서 제외'}).click();
  await expect(page.getByTestId('slot-main')).not.toContainText('간장제육볶음');
  await page.getByRole('button',{name:'되돌리기',exact:true}).click();
  await expect(page.getByTestId('slot-main')).toContainText('간장제육볶음');
  await page.getByRole('button',{name:'주찬 메뉴 선택'}).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button',{name:'주찬 메뉴 선택'})).toBeFocused();
});

test('텍스트·이미지·CSV·백업을 내보내고 백업을 복원한다', async ({ page, context }, testInfo) => {
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/');
  await page.getByRole('button',{name:'텍스트 복사',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toContain('식단 초안');
  const pngPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'이미지 저장',exact:true}).click();
  const png=await pngPromise;
  const pngPath=testInfo.outputPath('meal.png'); await png.saveAs(pngPath);
  const fs=await import('node:fs/promises');
  const bytes=await fs.readFile(pngPath);
  expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  expect(bytes.readUInt32BE(16)).toBeGreaterThan(500);
  await page.getByRole('button',{name:'주간 식단',exact:true}).click();
  await page.getByTestId('day-0').getByRole('button',{name:'현재 초안 담기'}).click();
  const csvPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'주간표 CSV 저장'}).click();
  const csv=await csvPromise; const csvPath=testInfo.outputPath('week.csv'); await csv.saveAs(csvPath);
  expect(await fs.readFile(csvPath,'utf8')).toContain('날짜');
  await page.locator('summary').filter({hasText:'저장과 백업'}).click();
  const backupPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'주간표 백업 저장'}).click();
  const backup=await backupPromise; const backupPath=testInfo.outputPath('backup.json');await backup.saveAs(backupPath);
  const saved=JSON.parse(await fs.readFile(backupPath,'utf8'));expect(saved.version).toBe(1);expect(Object.keys(saved.days)).toHaveLength(1);
  page.on('dialog',dialog=>dialog.accept());
  await page.getByTestId('day-0').getByRole('textbox',{name:'월요일 메모'}).fill('복원 전 메모');
  await page.getByLabel('주간표 백업 파일').setInputFiles(backupPath);
  await expect(page.getByTestId('day-0').getByRole('textbox',{name:'월요일 메모'})).toHaveValue('');
  expect(errors).toEqual([]);
});

test('구형 즐겨찾기·제외 목록을 보존하고 잘못된 저장값을 덮어쓰지 않는다', async ({ page }) => {
  const oldMeal={rice:'테스트밥',soup:'테스트국',main:'구형 즐겨찾기',side1:'반찬1',side2:'반찬2',kimchi:'김치',dessert:'후식'};
  await page.addInitScript(meal=>{if(!localStorage.getItem('seeded')){localStorage.setItem('auto-menu-favorites',JSON.stringify([meal]));localStorage.setItem('auto-menu-excluded',JSON.stringify(['가라아게']));localStorage.setItem('seeded','1');}},oldMeal);
  await page.goto('/');
  await page.locator('summary').filter({hasText:'보관함'}).click();
  await expect(page.getByRole('button',{name:'구형 즐겨찾기 테스트밥 / 테스트국'})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('auto-menu-excluded')!))).toEqual(['가라아게']);
  await page.evaluate(()=>localStorage.setItem('auto-menu-workspace-v1','broken-json'));
  await page.reload();
  await expect(page.locator('.storage-warning')).toContainText('자동 저장을 중단');
  await page.getByRole('button',{name:'고정하지 않은 메뉴 추천'}).click();
  expect(await page.evaluate(()=>localStorage.getItem('auto-menu-workspace-v1'))).toBe('broken-json');
});

test('작은 화면에서 가로 넘침 없이 핵심 동작을 찾을 수 있다', async ({ page }, testInfo) => {
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const action=page.getByRole('button',{name:'고정하지 않은 메뉴 추천'});
  await expect(action).toBeVisible();
  const rect=await action.boundingBox();expect(rect!.y+rect!.height).toBeLessThan(page.viewportSize()!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('meal-screen.png'),fullPage:true});
  await page.getByRole('button',{name:'주간 식단',exact:true}).click();
  for (let i=0;i<5;i++) await page.getByTestId(`day-${i}`).getByRole('button',{name:'현재 초안 담기'}).click();
  await expect(page.locator('.repeat-notice')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.app-toast')).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath('week-screen.png'),fullPage:true});
  expect(errors).toEqual([]);
});


test('다른 탭의 변경과 저장소 쓰기 실패를 조용히 덮어쓰지 않는다',async({page,context})=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:'고정하지 않은 메뉴 추천'})).toBeVisible();
  const other=await context.newPage();await other.goto('/');
  await other.getByRole('button',{name:'고정하지 않은 메뉴 추천'}).click();
  await expect(page.locator('.storage-warning')).toContainText('다른 탭');
  const stored=await other.evaluate(()=>localStorage.getItem('auto-menu-workspace-v1'));
  await page.getByRole('button',{name:'고정하지 않은 메뉴 추천'}).click();
  expect(await other.evaluate(()=>localStorage.getItem('auto-menu-workspace-v1'))).toBe(stored);
  await other.close();
});

test('저장 실패와 잘못된 백업은 기존 작업을 보존한다',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:'고정하지 않은 메뉴 추천'})).toBeVisible();
  const before=await page.evaluate(()=>localStorage.getItem('auto-menu-workspace-v1'));
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};});
  await page.getByRole('button',{name:'고정하지 않은 메뉴 추천'}).click();
  await expect(page.locator('.storage-warning')).toContainText('저장하지 못했어요');
  expect(await page.evaluate(()=>localStorage.getItem('auto-menu-workspace-v1'))).toBe(before);
  await page.locator('summary').filter({hasText:'저장과 백업'}).click();
  await page.getByLabel('주간표 백업 파일').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from('{"version":9,"days":{}}')});
  await expect(page.locator('.app-toast')).toContainText('백업을 불러오지 못했어요');
  expect(await page.evaluate(()=>localStorage.getItem('auto-menu-workspace-v1'))).toBe(before);
});

test('밥 후보가 소진되면 무한 로딩 대신 안내하고 직접 입력할 수 있다',async({page})=>{
  const fs=await import('node:fs/promises');
  const catalog=JSON.parse(await fs.readFile('data/menu_catalog.json','utf8'));
  await page.addInitScript(names=>localStorage.setItem('auto-menu-excluded',JSON.stringify(names)),catalog.rice.map((item:{name:string})=>item.name));
  await page.goto('/');
  await expect(page.getByTestId('slot-rice')).toContainText('추천 후보가 없어요');
  await page.getByRole('button',{name:'밥 메뉴 선택'}).click();
  await page.getByRole('dialog').getByRole('textbox').fill('직접 지은 특별밥');
  await page.getByRole('button',{name:'직접 입력한 메뉴 사용'}).click();
  await expect(page.getByTestId('slot-rice')).toContainText('직접 지은 특별밥');
});


test('삭제된 브랜드·오분류 메뉴는 검색 후보에 없고 대표 메뉴만 선택된다', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name:'후식 메뉴 선택', exact:true}).click();
  const dialog = page.getByRole('dialog');
  for (const name of ['클램차우더', '과수원', '메론', '한국요구르트']) {
    await dialog.getByRole('textbox').fill(name);
    await expect(dialog.getByRole('button', {name:`${name} 선택`, exact:true})).toHaveCount(0);
  }
  await dialog.getByRole('textbox').fill('멜론');
  await dialog.getByRole('button', {name:'멜론 선택', exact:true}).click();
  await expect(page.getByTestId('slot-dessert')).toContainText('멜론');
  await page.reload();
  await expect(page.getByTestId('slot-dessert')).toContainText('멜론');
});

test('검색 결과가 많아도 정확한 이름의 메뉴를 선택할 수 있다',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'국 메뉴 선택',exact:true}).click();
  await page.getByRole('dialog').getByRole('textbox').fill('된장국');
  await expect(page.getByRole('dialog').getByRole('button',{name:'된장국 선택',exact:true})).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'된장국 선택',exact:true}).click();
  await expect(page.getByTestId('slot-soup').locator('.meal-name')).toHaveText('된장국⌄');
});
