# Diablo II · Emberfall

Diablo II 에셋 카탈로그를 참고한 브라우저 액션 RPG 프로토타입과 Codex 반복 개발 하네스.

게임 실행: https://dubu.github.io/diablo2/

## 실행

Node.js 22 이상. 외부 패키지 설치 없이 실행합니다.

```sh
npm run dev
```

http://127.0.0.1:5173 에 접속합니다. WASD/방향키 또는 클릭으로 이동, Space 근접 공격(누르기 유지 가능), Q 화염 파동, 1 회복약, I 소지품, J 퀘스트, Esc 일시 정지. 모든 적 12마리를 처치하면 승리합니다. 전리품 가까이 가면 자동 획득하며 승리 시 남은 보상을 정산합니다.

## 개발 및 검증

```sh
npm run check
npm run harness
npm run harness -- 123
npm run codex:task -- --dry-run "화염 파동 범위와 밸런스 개선"
npm run codex:task -- "화염 파동 범위와 밸런스 개선"
```

마지막 명령은 로그인된 Codex CLI를 실제 호출하며 계정 사용량이 발생할 수 있습니다. 현재 설치된 CLI의 기본 모델을 사용합니다. dry-run은 프롬프트만 생성합니다. artifacts/에 JSON 검증 결과, Codex JSONL 이벤트, 최종 응답을 기록합니다.

브라우저 자동화는 /?harness=1의 window.__game API를 사용할 수 있습니다. 상세 규격은 docs/architecture.md 참고.

## 구현 범위와 에셋 상태

등각 시점 수도원, 추적 AI, 보스, 근접/범위 공격, 체력/마나/회복약, 골드/경험치, 소지품, 퀘스트, 승패/재시작, 반응형 HUD.
**원본 Diablo II 에셋 6종을 적용했습니다**: 바바리안, 폴른 샤먼, 활을 든 해골, 대장장이, 수도원 바닥, 화염. 로컬 애니메이션 시트로 로딩하며 벽·기둥·HUD·불티·잔광은 자체 그래픽입니다. 출처와 크레딧은 docs/assets.md와 public/assets/catalog.json에 기록했습니다. 장비 장착·저장·장애물 충돌은 아직 구현하지 않았습니다.

Codex 하네스는 AGENTS.md, 작업 템플릿, CLI 실행기, 결정적 시뮬레이션, 검증 리포트로 구성됩니다.
공식 참고: https://learn.chatgpt.com/docs/agent-configuration/agents-md 및 https://learn.chatgpt.com/docs/non-interactive-mode

## GitHub Pages 배포

```sh
npm run verify
npm run preview
```

배포 파일은 `dist/`에 생성되고 미리보기는 http://127.0.0.1:5173/diablo2/ 에서 실행됩니다. 공개 저장소 `dubu/diablo2`의 Pages는 **GitHub Actions**로 설정되어 main push 시 검증 후 배포합니다. PR은 검증만 수행합니다.

자세한 최초 설정과 복구 절차: [docs/deployment.md](docs/deployment.md).

현재 임시 쉬움 밸런스: 체력 1000, 마나 300, 회복약 20개(회당 500 회복), 마나 초당 15 회복, 받는 피해 60% 감소. `1`키로 회복약을 사용합니다. 임시 수치는 `src/engine.js`의 `BALANCE`에서 조절할 수 있습니다.
