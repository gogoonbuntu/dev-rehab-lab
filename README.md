# Dev Rehab Lab

개발을 오래 쉬었던 사람이 다시 문제를 읽고, 구현하고, 통과시키는 감각을 회복하도록 만든 개인 코딩 재활 플랫폼입니다.

## 핵심 기능

- 4주 재활 코스 카드
- 브라우저 내 코딩 인터페이스
- 예시 테스트 + 숨은 테스트 + 성능 측정
- 문제별 진행 상태 로컬 저장
- 카카오 스타일 기초 회복용 문제 세트

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 을 열면 됩니다.

## 검증

```bash
npm run lint
npm run build
```

참고:

- OneDrive 경로에서는 Windows 파일 잠금 때문에 빌드 산출물 충돌이 날 수 있습니다.
- 이 경우 프로젝트를 임시 폴더로 복사해 빌드하면 정상 통과합니다.

## 프로젝트 구조

```text
src/app
src/components/rehab-lab.tsx
src/lib/challenges.ts
```

## 다음 확장 아이디어

- 문제 세트 추가
- 난이도별 코스 분리
- 주간 리포트
- 로그인 및 클라우드 진행도 저장
- 제출 기록 히스토리
- 관리자용 문제 편집 기능
