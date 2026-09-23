# GitHub Pages 배포

게임 URL: https://dubu.github.io/diablo2/
공개 저장소: https://github.com/dubu/diablo2
2026-09-23 GitHub Actions 기반 Pages를 활성화하고 최초 배포를 확인했습니다.

## 준비된 구성

- `.github/workflows/pages.yml`: PR에서 검증/빌드, main push 또는 main 수동 실행에서 배포.
- `npm run verify`: 구문 검사 + 10개 테스트 + 결정적 전투 하네스 + 정적 빌드.
- `dist/`: index.html, src/, public/, .nojekyll만 포함. Codex 작업 로그와 개발 문서는 미포함.
- 상대 경로를 사용하므로 계정 루트 사이트, `/diablo2/`, 다른 저장소명 모두 동일한 산출물 사용.
- Node는 개발/CI 도구용이며 배포된 게임은 브라우저에서만 실행.

## 저장소 연결 후 최초 배포

1. 프로젝트를 GitHub 저장소 `dubu/diablo2`의 main 브랜치에 올립니다. 로컬 Git 저장소의 origin은 `git@github.com:dubu/diablo2.git`입니다.
2. 저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 설정합니다.
3. Actions → Verify and deploy GitHub Pages → Run workflow → main을 선택합니다. 설정 후 main에 push해도 자동 실행됩니다.
4. build와 deploy 작업 성공 후 github-pages 환경에 표시되는 실제 URL을 엽니다.
5. 일반 프로젝트 저장소 주소는 `https://<owner>.github.io/<repository>/`입니다. 저장소명에 맞춰 코드나 빌드를 수정할 필요 없습니다.

기본 브랜치가 main이 아니면 워크플로의 push/pull_request 브랜치 및 deploy의 refs/heads/main 조건을 함께 변경합니다. PR은 운영 배포하지 않습니다. main 이외 브랜치 수동 실행도 검증만 수행합니다.

GitHub Free에서는 공개 저장소로 Pages를 사용할 수 있으며, 비공개 저장소는 지원 플랜이 필요합니다. 조직 정책에 따라 Actions/Pages 사용 허용이 필요할 수 있습니다.

## 로컬에서 배포 산출물 확인

```sh
npm run verify
npm run preview
```

`http://127.0.0.1:5173/diablo2/`에서 실제 dist 파일을 확인합니다. 다른 저장소 경로 확인:

```sh
node scripts/server.mjs --dist --base=/another-repository/
```

프로젝트 전체가 아닌 dist/만 게시해야 합니다. `/?harness=1`에 해당하는 개발용 API는 현재 산출물에서도 쿼리로 활성화할 수 있습니다. 로컬 싱글 플레이 테스트용이며 서버 권한·계정 데이터가 없습니다.

## 배포 후 확인 및 복구

- URL 새로고침 시 Canvas/스타일/스크립트 정상 로딩.
- WASD/클릭 이동, Space/Q/1 조작, 소지품, 정지·재개, 사망·재시작 확인.
- 개발자 콘솔 오류 및 에셋 404 확인.
- 문제가 있으면 원인 변경을 되돌린 커밋을 main에 반영해 다시 검증·배포합니다.

현재 CI는 Node 기반 검증입니다. 브라우저 조작은 수동 검증했으며 CI 브라우저 자동화, Chrome/Edge/Safari 전체 호환성 및 모바일 터치 플레이는 아직 검증하지 않았습니다.

공식 자료:
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
