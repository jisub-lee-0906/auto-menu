# 오늘의 급식 (Auto Menu App)

실사용 급식 메뉴 데이터를 바탕으로 한 끼 식단 조합을 빠르게 생성하는 Next.js 앱입니다.  
영양사나 식단 기획자가 초안 아이디어를 검토하거나, 사용자가 조건에 맞는 급식 구성을 가볍게 탐색하는 용도로 설계되었습니다.

배포 주소: [https://auto-menu-app-omega.vercel.app/](https://auto-menu-app-omega.vercel.app/)

## 주요 기능

- 자동 식단 생성
  - 밥, 국/찌개, 메인 반찬, 반찬 2종, 김치, 후식을 한 번에 조합합니다.
- 메뉴 잠금
  - 원하는 항목은 고정하고 나머지만 다시 생성할 수 있습니다.
- 개별 새로고침
  - 특정 슬롯만 다시 뽑아 미세 조정할 수 있습니다.
- 제외 메뉴 관리
  - 원하지 않는 메뉴를 제외 목록에 넣고, 해제하거나 전체 초기화할 수 있습니다.
- 최근 조합 / 즐겨찾기
  - 방금 본 식단을 다시 불러오거나 마음에 드는 조합을 저장할 수 있습니다.
- 메뉴 검색
  - 이름과 태그 기준으로 전체 메뉴를 검색할 수 있습니다.
- 텍스트 복사 / 이미지 저장
  - 식단을 텍스트로 복사하거나 카드 이미지로 저장할 수 있습니다.

## 기술 스택

- Framework: Next.js 16
- Language: TypeScript
- UI: React 19, Tailwind CSS 4
- Utility: html2canvas
- Deployment: Vercel

## 프로젝트 구조

```text
app/          앱 라우터 페이지
components/   UI 컴포넌트
data/         메뉴 원본 및 구조화된 카탈로그
docs/         데이터 정책과 검토 문서
lib/          메뉴 생성 로직과 카탈로그 유틸
scripts/      데이터 정제 / 빌드 / 감사 스크립트
tests/        Playwright 스모크 테스트
```

## 데이터 구조

이 프로젝트는 데이터베이스 없이 정적 JSON 파일을 사용합니다.

- `data/menu_db.json`
  - 카테고리별 원본 메뉴 데이터
- `data/menu_catalog.json`
  - 앱에서 사용하는 구조화된 메뉴 카탈로그
- `data/menu_catalog_overrides.json`
  - 수동 보정용 메타데이터 오버라이드

구조화된 카탈로그에는 아래 필드가 포함됩니다.

- `id`
- `name`
- `category`
- `tags`
- `protein`
- `cookingMethod`
- `spicyLevel`
- `mealWeight`

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 주요 스크립트

```bash
npm run dev
npm run build
npm run lint
npm run clean:data
npm run build:data
npm run audit:data
npm run audit:catalog
npm run audit:consistency
```

### 데이터 관리

- `npm run clean:data`
  - 원본 메뉴 데이터를 정제합니다.
- `npm run build:data`
  - 구조화된 메뉴 카탈로그를 생성합니다.
- `npm run audit:data`
  - 원본 데이터의 중복과 카테고리 충돌을 검사합니다.
- `npm run audit:catalog`
  - 구조화된 카탈로그의 필드 무결성과 category 정합성을 검사합니다.
- `npm run audit:consistency`
  - 실제 생성 로직 기준으로 필터, 제외 목록, 슬롯 category 정합성을 검사합니다.

## 현재 서비스 성격

이 프로젝트는 실제 급식 운영 시스템이 아니라 식단 아이디어를 빠르게 탐색하기 위한 보조 도구입니다.

포함하지 않는 범위:

- 사용자 로그인
- 관리자 페이지
- 서버 데이터베이스
- 식단 원가 계산
- 영양 성분 계산
- 기관별 급식 운영 정책 엔진

## 검증 상태

현재 기준으로 아래 항목을 통과합니다.

- `npm run lint`
- `npm run build`
- `npm run audit:data`
- `npm run audit:catalog`
- `npm run audit:consistency`

## 크레딧

- Dev: 이지섭
- Data: 문채영
