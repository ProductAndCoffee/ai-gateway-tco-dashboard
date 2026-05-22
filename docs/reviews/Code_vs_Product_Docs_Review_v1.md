# Code vs Product Docs Review v1

Date: 2026-05-16  
Scope: `gateway/`, `web/`, and current product docs in `docs/product/`  
Review lens: demoable portfolio product for interview use

## Executive Summary

The implementation has the right skeleton for the AI Gateway Simulator: an OpenAI-compatible FastAPI endpoint, seeded apps, semantic-cache lookup, model routing, a live request table, KPI cards, scenario buttons, reset, replay, and a separate Apps page.

It is not ready against the current PRD/TDD/UX contract yet. The main issue is not polish; it is that several interview-critical behaviors are either missing, partially implemented, or not deterministic enough for a live demo. The most important gaps are manual prompt repeat behavior, missing auto-open/detail flow, missing report and demo-control APIs, lifetime-count rate limiting, Apps actions that do not work, and failing frontend lint.

## Findings

### P0 - Manual Prompt Demo Is Not Contract-Complete

Product contract:
- PRD requires same manual prompt twice under same app context to produce miss then hit, update metrics, and open latest request detail drawer (`docs/product/PRD.md:36-38`).
- TDD requires exact repeated prompts to hit regardless of embedding variance and return `request_id` (`docs/product/TDD.md:62-67`, `docs/product/TDD.md:125-133`).
- UX requires first row flash blue, second row flash green, and detail drawer auto-open (`docs/product/UX_Guide.md:47-54`).

Code gaps:
- `web/src/components/ManualConsole.tsx:25-27` submits the prompt and clears the input, but it does not capture a returned request id, refresh the stream, preserve the prompt for immediate repeat, or open the latest detail drawer.
- `gateway/main.py:195-216` returns only OpenAI-style `id: chatcmpl-{uuid}` and does not expose a plain `request_id` field.
- `gateway/main.py:181-191` inserts request rows without setting `is_manual`, even though the schema has `is_manual` (`gateway/db.py:51`).
- `gateway/vector.py:46-78` only checks vector similarity. There is no exact prompt-hash lookup path, despite the TDD requirement that exact repeats hit regardless of embedding variance.

Impact:
The strongest interview moment can fail or feel passive: the user cannot reliably type a random prompt twice and have the UI visibly prove "miss then hit" with the drawer opening automatically.

Recommended fix:
Add normalized exact prompt hashing per app before vector search, return `request_id` from `/v1/chat/completions`, mark manual requests either via an explicit request metadata flag or a dedicated manual endpoint wrapper, and make `ManualConsole` notify `RequestStream` to select/open the new request.

### P0 - Documented Demo Controls and APIs Are Missing

Product contract:
- PRD lists generate test traffic, pause/resume, clear cache, refresh dashboard, export report, replay, and adjustable threshold (`docs/product/PRD.md:65-75`).
- TDD lists `/api/demo/traffic/start`, `/pause`, `/resume`, `/api/demo/cache/clear`, `/api/demo/report`, and `PATCH /api/apps/{app_id}/limits` (`docs/product/TDD.md:68-84`).
- UX assumes pause/resume, export report, threshold adjustment, and app-limit recovery flows (`docs/product/UX_Guide.md:14-16`, `docs/product/UX_Guide.md:35-45`).

Code gaps:
- Implemented backend demo APIs stop at reset, scenario run, and replay (`gateway/main.py:325-356`).
- `web/src/app/controls/page.tsx:99-106` renders a disabled threshold slider and labels it visual-only.
- `web/src/app/controls/page.tsx:108-114` only exposes reset; no clear-cache, export-report, traffic start/pause/resume, or manual refresh controls.
- `web/src/app/apps/page.tsx:72-76` shows Edit Limit and Copy Key buttons but neither has behavior.

Impact:
The UI overpromises controls that are central to the operator story. An interviewer can reasonably click these and find they do nothing or are absent.

Recommended fix:
Either implement the contracted endpoints and bind UI controls, or explicitly descope them in PRD/TDD/UX. For the current demo objective, implement at least clear cache, export report, manual refresh, and app limit patching.

### P1 - Rate Limiting Does Not Match RPM Semantics

Product contract:
- PRD says the app receives 429 after exceeding configured RPM (`docs/product/PRD.md:31-32`).
- TDD includes rate-limit threshold tests (`docs/product/TDD.md:125-128`).

Code gap:
- `gateway/main.py:54-66` counts all historical requests for an app and compares that lifetime count to `rpm_limit`. This is not requests per minute. After `support-bot` reaches 100 total requests, it will be throttled forever until reset.
- `web/src/app/apps/page.tsx:57-59` displays `requests / rpm_limit`, reinforcing the same lifetime-count behavior.

Impact:
Longer demos become brittle, and app status can become "Limited" because of accumulated demo history rather than a current burst.

Recommended fix:
Filter request counts to a rolling 60-second window for RPM. Separately show lifetime request count and current-window RPM on the Apps page.

### P1 - Report and Manual Metrics Cannot Be Produced Correctly

Product contract:
- PRD requires an export report containing total requests, hit rate, spend, cost avoided, and throttled count (`docs/product/PRD.md:42-43`).
- TDD specifies report fields including `manual_prompt_count`, `manual_cache_hits`, `manual_cost_avoided`, p95 latency, and top apps by spend (`docs/product/TDD.md:77-84`).

Code gaps:
- There is no `/api/demo/report` endpoint (`gateway/main.py:325-356`).
- Manual requests are never marked (`gateway/main.py:181-191`), so manual-specific report fields cannot be computed.
- `gateway/main.py:239-243` approximates cache cost avoided by summing prompt plus completion tokens and pricing them as input tokens only, which conflicts with the token-normalized formula in `docs/product/TDD.md:111-120`.

Impact:
The project cannot produce the promised artifact that summarizes the demo run, and some displayed savings are directionally useful but technically weak.

Recommended fix:
Add baseline-cost fields or compute baseline cost using prompt and completion tokens separately. Implement `/api/demo/report` from request logs and include manual/scenario distinctions.

### P1 - Scenario Runner Is Fragile Outside One Local Port

Code gap:
- `gateway/scenarios.py:5` hard-codes `http://127.0.0.1:8000`, and scenario replay calls the public HTTP endpoint from inside the backend (`gateway/scenarios.py:57-65`, `gateway/scenarios.py:81-83`).

Impact:
Scenarios fail if the backend is hosted on another port, behind a container service name, or invoked in tests without the network server available.

Recommended fix:
Move scenario execution to an internal service function shared with the HTTP endpoint, or make `API_URL` configurable through environment variables with a sane default.

### P1 - Frontend Lint Fails

Verification:
- `python3 -m py_compile gateway/main.py gateway/router.py gateway/db.py gateway/vector.py gateway/scenarios.py` passes.
- `npm run lint` fails.

Lint failures:
- `web/src/app/apps/page.tsx:7` uses `any`; `web/src/components/ManualConsole.tsx:28` uses `any`.
- `web/src/components/RequestStream.tsx:8` and `web/src/components/RequestStream.tsx:10` use `any`.
- `web/src/components/RequestStream.tsx:32` synchronously sets state inside an effect.
- Several unused imports/variables are present.

Impact:
The project is not in a clean handoff state, and the current code would fail a standard CI lint gate.

Recommended fix:
Add typed DTOs for apps, requests, metrics, and request detail; remove unused imports; refactor detail reset handling so lint passes.

### P2 - API Key Storage Does Not Match TDD

Product contract:
- TDD models `apps` with `api_key_hash` (`docs/product/TDD.md:33-37`).

Code gap:
- `gateway/db.py:21-27` stores raw `api_key`.
- `gateway/main.py:43-47` compares bearer tokens against raw keys.
- `web/src/components/ManualConsole.tsx:10-13` hardcodes `key_1` client-side.

Impact:
For a local portfolio simulator this is acceptable if documented as demo-only, but it contradicts the technical artifact and is easy for an interviewer to call out.

Recommended fix:
Either update the TDD to state seeded plaintext demo keys are intentionally used in local-only mode, or hash keys in SQLite and keep the UI key exposure framed as a seeded test credential.

### P2 - Apps Page Is Separate Now, But Actions Are Still Mocked

Code status:
- Navigation correctly has separate Apps and Demo Controls items (`web/src/components/ui/Sidebar.tsx:7-12`).
- Apps page is a distinct route (`web/src/app/apps/page.tsx:6-86`).

Remaining gap:
- `Edit Limit` and `Copy Key` buttons are visible but inert (`web/src/app/apps/page.tsx:72-76`), while UX expects app settings recovery after rate-limit breach (`docs/product/UX_Guide.md:43-45`).

Recommended fix:
Implement a lightweight edit dialog backed by `PATCH /api/apps/{app_id}/limits`. For Copy Key, either copy seeded demo key to clipboard or remove the button until key management exists.

## Readiness Assessment

Not ready for a live interview demo yet.

The backend and frontend are close enough to be stabilized quickly, but the current state should be treated as an implementation draft. Before demoing, prioritize:

1. Manual console miss-hit-detail flow.
2. Report, clear-cache, app-limit patch, and manual refresh controls.
3. Rolling-window rate limiting.
4. Correct savings calculations and manual/scenario metrics.
5. Lint cleanup and typed frontend DTOs.

## Suggested Acceptance Checklist

- Reset demo clears requests, cache entries, FAISS index, metrics, and restores seeded apps.
- Type random prompt in Manual Console, submit once: live row appears as cache miss and drawer opens.
- Submit exact same prompt again: live row appears as cache hit, drawer opens, cost avoided increases.
- Run scenario 1: visible miss then hit.
- Run scenario 2: visible cheap-model route and advanced-model route.
- Run scenario 3: rogue app shows 429 based on a rolling RPM window.
- Run scenario 4: live-data app shows cache bypass.
- Apps page can edit RPM/budget and recover from rate-limit scenario.
- Export report returns and downloads/prints the documented summary fields.
- `npm run lint` passes.
