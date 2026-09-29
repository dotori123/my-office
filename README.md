# MY OFFICE

개인 맞춤형 회사생활 정보 대시보드 — 프론트엔드 (React + TypeScript + Tailwind CSS)

## 기술스택

React 19 · TypeScript · Vite · Tailwind CSS 4 · three.js · PWA · Vercel

| 구분 | 기술 |
|---|---|
| 프레임워크 | React 19, TypeScript 6 |
| 빌드 | Vite 8 |
| 스타일 | Tailwind CSS 4 |
| 라우팅 | React Router 7 |
| 상태·저장 | Context + useReducer, localStorage (서버 없음) |
| 3D | three.js — 소개 페이지 hero의 달력 격자 |
| OCR | tesseract.js — 지출결의서 캡처 이미지에서 글자 읽기 (브라우저 안에서 처리) |
| 오프라인·설치 | vite-plugin-pwa (Workbox 서비스 워커) |
| 린트 | oxlint |
| 배포 | Vercel |

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드
```

## 구조

```
src/
├── data/        초기 상태(빈 값), 2026 공휴일  → 추후 API 응답으로 교체
├── store/       AppContext (useReducer + localStorage)
├── utils/       날짜 계산, 근속기간, 연차 추천 알고리즘, 지원비 통계
├── components/  공용 UI(Card, Modal, Button …), Layout(상단 내비 + 내 정보)
└── pages/       Dashboard / 연차 / 지원비 / Calendar / 프로젝트
    └── intro/   소개 페이지(/intro) — 내비 없이 공유용 링크로만, three 를 써서 따로 불러온다
```

- 모든 데이터는 사용자가 직접 입력합니다. 사용자 정보·총 연차·총 지원금은 상단 내비의 **내 정보**에서, 나머지는 각 페이지의 등록 버튼에서 입력하세요.
- 데이터는 `localStorage`(`my-office:v2`)에 저장됩니다. 초기화하려면 브라우저 저장소를 지우세요.
- `.env` 의 `VITE_SITE_URL` 은 `index.html` 의 OG 태그(`%VITE_SITE_URL%`)에 치환됩니다. 배포 도메인이 정해지면 이 값을 바꾸고 다시 빌드하세요 (`.env` 변경 후에는 dev 서버 재시작 필요).
- API 연동 시 `store/AppContext.tsx` 의 reducer action 을 API 호출로 대체하면 됩니다.
