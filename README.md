# Kanban Bookmarks

Chrome 북마크 폴더를 새 탭에서 칸반 보드로 관리하는 확장 프로그램.

- 루트 폴더 아래의 하위 폴더 = 보드, 그 아래 폴더 = 컬럼, 북마크 = 카드
- 툴바 버튼으로 현재 탭을 칸반에 담기
- 보드/카드 이름·아이콘 인라인 편집, 드래그 정렬, 라이트/다크 테마

## 설치

```bash
npm ci
npm run build
```

`chrome://extensions` → 개발자 모드 ON → **압축해제된 확장 프로그램 로드** → `dist/` 선택.

옵션 페이지에서 루트 북마크 폴더를 한 번 지정하면 새 탭이 보드로 바뀐다.

## 여러 컴퓨터에서 쓰기

각 컴퓨터에서 위 설치 과정을 그대로 반복하면 된다. 두 Chrome이 **같은 Google 계정으로 로그인**돼 있어야 데이터가 붙는다.

- 보드/컬럼/카드 → Chrome 북마크 동기화를 그대로 탐
- 테마, 커스텀 아이콘, 루트 폴더 설정 → `chrome.storage.sync`

`chrome.storage.sync`는 확장 ID 단위로 격리되는데, unpacked 확장의 ID는 로드한 디렉터리 경로에서 파생된다. 그래서 `manifest.config.ts`에 공개키(`key`)를 고정해 두었다 — 경로가 달라도 두 컴퓨터가 같은 ID, 같은 sync 버킷을 본다. 이 값은 지우거나 바꾸지 말 것 (바꾸면 설정이 초기화된다).

## 개발

```bash
npm run dev     # vite (HMR)
npm test        # vitest
npm run check   # svelte-check
```
