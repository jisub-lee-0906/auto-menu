# 오늘의 급식 (Auto Menu App)

한국형 급식 메뉴 데이터를 기반으로 식단 조합을 빠르게 생성하는 Next.js 앱입니다.  
영양사나 식단 기획자가 초안 아이디어를 빠르게 뽑아보는 보조도구를 목표로 합니다.

배포 주소: [https://auto-menu-app-omega.vercel.app/](https://auto-menu-app-omega.vercel.app/)

## 주요 기능

- 급식 식단 자동 생성
  - 밥, 국·찌개, 메인 반찬, 반찬 2종, 김치, 후식을 한 번에 조합합니다.
- 부분 고정
  - 원하는 항목은 잠그고 나머지만 다시 생성할 수 있습니다.
- 개별 새로고침
  - 특정 슬롯만 다시 뽑아 식단을 미세 조정할 수 있습니다.
- 제외 메뉴 관리
  - 원하지 않는 메뉴를 제외 목록에 넣고, 다시 해제하거나 전체 초기화할 수 있습니다.
- 최근 조합 / 즐겨찾기
  - 방금 본 식단을 다시 불러오거나, 마음에 드는 조합을 따로 저장할 수 있습니다.
- 추천 설명
  - 현재 조합의 성격을 요약 문장과 배지로 보여줍니다.
- 메뉴 검색
  - 이름과 태그 기준으로 전체 메뉴를 검색할 수 있습니다.
- 복사 / 이미지 저장
  - 식단 텍스트를 복사하거나 카드 이미지를 저장할 수 있습니다.

## 기술 스택

- Framework: Next.js 16
- Language: TypeScript
- UI: React 19, Tailwind CSS 4
- Utility: html2canvas
- Deployment: Vercel

## 프로젝트 구조

```text
app/          앱 라우트와 페이지
components/   UI 컴포넌트
data/         메뉴 원본 및 구조화 카탈로그
lib/          메뉴 생성 로직과 카탈로그 유틸
scripts/      데이터 정리 / 검증 스크립트
docs/         데이터 정책 및 검수 문서
```

## 데이터 구조

이 프로젝트는 DB 없이 정적 JSON 파일을 사용합니다.

- `data/menu_db.json`
  - 카테고리별 원본 메뉴 데이터
- `data/menu_catalog.json`
  - 앱에서 실제로 사용하는 구조화된 메뉴 카탈로그
- `data/menu_catalog_overrides.json`
  - 수동 보정용 오버라이드 데이터

구조화 카탈로그에는 아래 정보가 포함됩니다.

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

브라우저에서 `http://localhost:3000` 을 열면 됩니다.

## 주요 스크립트

```bash
npm run dev
npm run build
npm run lint
npm run clean:data
npm run build:data
npm run audit:data
npm run audit:catalog
```

### 데이터 관련

- `npm run clean:data`
  - 원본 메뉴 데이터를 정리합니다.
- `npm run build:data`
  - 구조화된 메뉴 카탈로그를 생성합니다.
- `npm run audit:data`
  - 원본 데이터 중복/충돌을 검사합니다.
- `npm run audit:catalog`
  - 구조화 카탈로그 무결성을 검사합니다.

## 현재 서비스 성격

이 프로젝트는 급식 운영 시스템이 아니라, 식단 아이디어를 빠르게 만들기 위한 보조도구입니다.

포함하지 않는 것:

- 사용자 로그인
- 관리자 페이지
- 서버 데이터베이스
- 원가 계산
- 영양 성분 계산
- 기관별 급식 운영 정책 엔진

## 검증 상태

현재 기준으로 아래 항목을 통과합니다.

- `npm run lint`
- `npm run build`
- 원본 메뉴 데이터 중복/교차 중복 정리
- 구조화 카탈로그 생성 및 검증
- 데스크톱 / 모바일 배포본 기본 동작 확인

## 크레딧

- Dev: 이지섭
- Data: 문채영
