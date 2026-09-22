# 오늘의 급식

한국 초·중·고 영양교사가 식단 아이디어를 얻고, 한 끼 초안을 수정해 주간표로 정리하는 Next.js 앱입니다.

운영 주소: https://auto-menu-app-omega.vercel.app/

메뉴 데이터의 정리 기준과 신뢰 범위는 [데이터 정책](docs/menu-data-policy.md)을 확인하세요.

## 공개 준비 상태

- 상태: **웹 애플리케이션 (로컬 테스트·빌드 검증)**. 기존 로컬 검증 기록에는 lint, typecheck, logic 테스트 38개, 데이터 감사와 production build 통과가 있습니다.
- 이 근거는 로컬 테스트·빌드 검증입니다. 브라우저 E2E는 이 환경에서 Playwright Chromium이 없어 실행·검증되지 않았고, 아래 운영 주소의 현재 서비스 상태도 이 문서 검토로 검증하지 않습니다.
- `npm run dev` 또는 `npm run start`는 로컬 개발·미리보기용입니다. 운영 배포와 실제 사용자 데이터는 별도 환경에서 확인해야 합니다.

## 사용 흐름

1. **한 끼 만들기**에서 초안을 추천받습니다.
2. 메뉴 이름을 눌러 검색하거나 직접 입력합니다. 유지할 메뉴는 **고정**합니다.
3. **주간표에 담기**에서 날짜를 고르고 **현재 초안 담기**를 누릅니다.
4. 날짜별 **불러와 편집** 후 **이 날짜에 수정 저장**을 누르면 해당 날짜에 반영됩니다.
5. **주간표 CSV 저장**으로 엑셀에서 편집하거나 **저장과 백업**에서 JSON 파일을 보관합니다.

추천 조건 변경은 현재 초안을 바꾸지 않습니다. 다음 추천에 적용되며, 조건과 다른 고정·직접 선택 메뉴는 확인 안내를 표시합니다. ‘한식 우선 추천’은 제외 필터가 아니라 추천 점수에 반영하는 선호 조건입니다.

### 지원 기능

- 전체/개별 추천, 잠금, 직접 메뉴 검색·입력, 제외 및 제외 해제
- 최근 변경 되돌리기, 즐겨찾기와 최근 초안
- 월~금 날짜별 식단·메모·급식 없는 날 설정
- 같은 이름의 메뉴가 여러 급식일에 반복될 때 안내
- 식단 텍스트 복사, PNG 이미지, UTF-8 BOM CSV 출력
- 날짜별 식단 JSON 백업/복원, 자동 로컬 저장
- 이전 버전의 즐겨찾기·최근 이력·제외 목록 비파괴 이전
- 저장소 실패·손상·다른 탭 수정 감지

### 저장 범위와 주의점

- 서버 데이터베이스/계정은 없습니다. 초안·즐겨찾기·주간표는 **이 브라우저에만** 저장됩니다.
- 주간표 백업 JSON은 모든 날짜의 식단·메모·급식 없음 상태를 포함합니다. 현재 초안·즐겨찾기·제외 목록은 포함하지 않습니다.
- 백업 복원은 기존 날짜별 식단 전체를 교체합니다. 확인 후 실행하며, 현재 세션의 되돌리기로 취소할 수 있습니다.
- 급식 없음 체크는 해당 날짜의 메뉴를 삭제하지 않습니다. CSV와 반복 안내에서는 제외하고, 체크 해제 시 다시 표시합니다.
- 다른 탭에서 수정되면 현재 탭의 자동 저장을 중단합니다. 필요한 주간표를 백업하고 새로고침하세요.
- 손상된 저장값은 자동 덮어쓰지 않습니다. ‘기존 저장값 보관’으로 원문을 보관한 후 명시적으로 저장을 재개할 수 있습니다. 이 원문 보관 파일은 주간표 가져오기 형식과 다릅니다.

## 신뢰 범위

이 앱은 식단 아이디어 도구이지 영양 적합성 판정·알레르기 안전 인증·급식 운영 시스템이 아닙니다.

메뉴명에서 재료/조리법/매운맛을 추정하므로 소스·육수·가공식품 원료나 학교별 레시피 차이는 알 수 없습니다. 직접 입력 메뉴는 재료 정보 미확인으로 표시됩니다. 실제 제공 전 영양교사가 레시피·제공량·알레르기·조리 조건을 검토해야 합니다.

월간 편성 화면, 주간 자동 일괄 생성, 영양·원가·발주 계산, 나이스 연동은 이번 범위에 없습니다.

## 실행

Node.js >=20.9.0, 프로젝트 package-lock.json 기준 npm 의존성을 사용합니다.

```sh
npm ci
npm run dev
```

개발 서버: http://localhost:3000

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

### 브라우저 테스트

테스트는 운영 사이트가 아니라 로컬 빌드만 대상으로 합니다.

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

다른 터미널에서:

```sh
npm run test:e2e
```

Playwright Chromium이 필요합니다. 기존 설치를 재사용하려면 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`에 실행 파일 절대 경로를 지정합니다. 실행 환경에 설치된 Chromium 경로를 사용하세요. 테스트 출력은 `.git/verification/playwright/`이며, 테스트를 다시 실행하면 해당 출력 폴더를 갱신합니다.

`tests/deployed-smoke.spec.ts`는 이전 운영 스모크 자료로 남아 있고 기본 테스트 구성에서 제외됩니다. 운영 사이트에 변경성 테스트를 실행하지 마세요.

## 데이터 관리

```sh
npm run build:data
node scripts/export_catalog_review.mjs
npm run audit:data
npm run audit:catalog
npm run audit:consistency
```

- `data/menu_curated.json`: 명시적으로 정리한 운영 메뉴와 추천 속성의 단일 편집 원본. 이름 기반 검수이지 레시피/알레르기 인증은 아닙니다.
- `scripts/curated-catalog.mjs`: 미확정 속성·중복·검수 근거 누락을 차단하는 검증기.
- `data/menu_db.json`, `data/menu_catalog.json`: 검수 원본에서만 생성합니다. 삭제한 메뉴를 과거 추론기로 되살리지 않습니다.
- `data/menu_catalog_overrides.json`, `data/menu_catalog_review_candidates.json`: 호환성을 위해 각각 빈 객체/빈 목록으로 유지합니다. 보류 메뉴는 운영에서 제거했습니다.
- `docs/data-curation-decisions.json`: 삭제 전 전체 메뉴의 보존/삭제 판정 기록. 앱의 추천·검색에서 읽지 않습니다.
- `audit:catalog`: 생성물과 원본의 정확한 일치, 판정 기록과의 일치, 미확정·중복·보류 없음 확인.
- `audit:consistency`: 복제한 알고리즘이 아니라 실제 production generator를 테스트합니다.

기존 브라우저에 저장한 사용자 식단은 자동 삭제하지 않습니다. 새 추천·검색은 정리된 카탈로그만 사용합니다.

정책: [docs/menu-data-policy.md](docs/menu-data-policy.md)

## 구조

```text
app/                    페이지 상태와 공통 스타일
components/             한 끼 편집기, 메뉴 선택창, 주간표 및 이전 컴포넌트
lib/menuCatalog.ts      카탈로그와 필터
lib/menuGenerator.ts    잠금과 조합 추천
lib/planner.ts          날짜, 주간표, CSV와 백업 검증
lib/workspace.ts        로컬 작업 공간 검증과 이력
scripts/                데이터 생성·감사
 tests/                 실제 로직 테스트와 로컬 브라우저 테스트
```

기술: Next.js 16 / React 19 / TypeScript / CSS + Tailwind / html2canvas / Playwright.

## 크레딧

- Dev: 이지섭
- Data: 문채영

## 자동 검증 현황 (2026-09-23)

GitHub Actions 워크플로와 실행 기록은 없습니다. 위 로컬 테스트·빌드 기록을 원격 CI 통과로 해석하지 마세요.

Vercel은 직전 보안 커밋 [`0caf3e1`](https://github.com/jisub-lee-0906/auto-menu/commit/0caf3e1517aa3787a627475648cb0749f2f225e3)의 배포 완료 상태를 보고했습니다. 실제 서비스 기능이나 E2E 동작까지 확인한 것은 아닙니다.
