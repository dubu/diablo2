# Diablo II / Emberfall prototype

Read README.md, docs/architecture.md, docs/assets.md, and docs/progress.md and docs/deployment.md before changes.
Follow any user-provided mandatory context-loading instructions as well.

## Development loop
1. State the requested behavior and acceptance criteria.
2. Keep simulation in src/engine.js independent of DOM, clocks, and rendering.
3. Implement the smallest complete playable change; preserve deterministic seeds.
4. Run npm run verify (checks, harness, and deploy build). Add behavioral tests for simulation changes.
5. Inspect the browser at http://127.0.0.1:5173. Check movement, combat, HUD, pause, inventory, and restart when touched.
6. Record evidence and remaining limitations in docs/progress.md.

## Harness
- npm run dev: local web server; no package installation required.
- npm run check: JavaScript syntax and Node test runner.
- npm run harness -- 666: deterministic combat fixtures, JSON evidence in artifacts/.
- /?harness=1: opt-in window.__game snapshot/reset/step/action API.
- npm run codex:task -- --dry-run "task": prepare a prompt without invoking another model.
- npm run codex:task -- "task": explicitly invoke the installed Codex CLI with workspace-write sandbox and JSONL output.
- Do not invoke another Codex process unless requested; do not recursively run codex:task.

## Boundaries
Preserve HTTP_PROXY, HTTPS_PROXY, NO_PROXY exactly; never put their values in files.
Do not read credentials. Do not publish, deploy, or commit automatically.
Do not represent procedural placeholder art as downloaded Diablo II assets.
Record provenance for every imported asset. Keep external sheets optional and provide a fallback.
