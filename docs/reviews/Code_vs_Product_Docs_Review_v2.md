# Code vs Product Docs Review v2

Date: 2026-05-16  
Scope: Re-review after fixes to `gateway/`, `web/`, and product-doc alignment  
Baseline: Follow-up to `Code_vs_Product_Docs_Review_v1.md`

## Executive Summary

The implementation is materially improved from v1. The main skeleton is now stronger: exact cache lookup exists, manual requests are marked, RPM is rolling-window based, app limits can be patched, cache clearing/report endpoints exist, frontend DTOs were added, and lint now passes.

It is still not ready for a live interview demo without a small second pass. The highest-risk issues are now concentrated around the live demo path: manual repeat still is not a true "hit submit again" interaction, replay is broken by the API-key hashing change, production build fails, and several product-doc controls/report fields remain incomplete.

## Resolved Since v1

- Exact prompt cache lookup added before vector search (`gateway/main.py:132-161`).
- Cache entries now store a real prompt hash (`gateway/main.py:172-188`).
- Manual requests are marked through `X-Manual-Request` (`gateway/main.py:104`, `gateway/main.py:197-210`).
- Request id is exposed through `X-Request-Id` and consumed by the UI (`gateway/main.py:101-103`, `web/src/lib/api.ts:90-91`).
- Rolling 60-second RPM check replaced lifetime-count rate limiting (`gateway/main.py:62-73`).
- Apps page now displays current RPM separately from total request count (`gateway/main.py:328-341`, `web/src/app/apps/page.tsx:66-68`).
- Clear-cache, export-report, and app-limit patch endpoints were added (`gateway/main.py:346-411`).
- Frontend types were added (`web/src/lib/types.ts:1-45`).
- `npm run lint` now passes.

## Remaining Findings

### P0 - Manual Console Still Does Not Support the Intended "Submit Again" Demo

Product contract:
- The PRD requires submitting the same manual prompt twice to produce cache miss then cache hit and open the latest detail drawer (`docs/product/PRD.md:36-38`).
- The UX specifically frames this as an interviewer giving a random prompt and the presenter submitting it twice (`docs/product/UX_Guide.md:47-54`).

Code status:
- `web/src/components/ManualConsole.tsx:25-28` submits, dispatches the request id, then clears the prompt.
- That means the presenter cannot simply hit submit again. They must retype/paste the same prompt, which weakens the core interactive demo.
- The drawer auto-open only works when a `RequestStream` is mounted on the same page as the console (`web/src/components/RequestStream.tsx:12-16`). The console on Demo Controls does not have a stream beside it (`web/src/app/controls/page.tsx:151-155`), so the documented drawer behavior is only true from Overview.

Impact:
This is the most important portfolio moment. It should be frictionless and deterministic.

Recommended fix:
Keep the prompt in the input after successful submission, add a visible "Submit Again" or leave the primary button usable for immediate repeat, and either move a request stream/detail drawer into Demo Controls or scope the auto-open behavior to the Overview console only in the docs.

### P0 - Replay Prompt Is Broken After API Key Hashing

Code status:
- App keys are now stored as SHA-256 hashes (`gateway/db.py:96-100`).
- Auth hashes the incoming bearer token and compares it to the stored hash (`gateway/main.py:49-55`).
- Replay fetches the stored `api_key` value from the DB and sends it as a bearer token (`gateway/main.py:430-437`, `gateway/scenarios.py:71-83`).

Why this breaks:
The replay flow sends the already-hashed key as if it were the raw seeded key. `get_app_context` hashes that hash again, so authentication fails.

Impact:
The UX Journey 3 replay flow will not work reliably (`docs/product/UX_Guide.md:31-33`).

Recommended fix:
Store a separate demo-only raw key label outside the app table for scenario/replay use, map `app_id` to seeded raw keys in code, or bypass HTTP replay and invoke shared request-processing logic internally.

### P1 - Production Build Fails

Verification:
- `python3 -m py_compile gateway/main.py gateway/router.py gateway/db.py gateway/vector.py gateway/scenarios.py` passes.
- `npm run lint` passes.
- `npm run build` fails.

Build failures:
- `web/src/components/ui/Sidebar.tsx:1-5` uses `usePathname` but the component is missing `"use client"`.
- `web/src/app/layout.tsx:2-6` uses `next/font/google`, which failed in this environment because the build attempted to fetch Google Fonts.

Impact:
The app may run in dev after hot compilation, but it is not cleanly buildable. For an interview portfolio project, this is a credibility issue.

Recommended fix:
Add `"use client"` to `Sidebar.tsx`. Replace `next/font/google` with the existing CSS font stack in `globals.css`, or self-host the font so builds do not depend on a live Google Fonts fetch.

### P1 - Report Endpoint Exists But Does Not Match TDD Fields or Cost Formula

Product contract:
- TDD report fields include `scenario_run_id`, `started_at`, `ended_at`, `scenario_request_count`, `cache_hits`, `estimated_baseline_spend`, `estimated_cost_avoided`, `manual_cost_avoided`, `routing_savings`, `average_latency_ms`, `p95_latency_ms`, and `top_apps_by_spend` (`docs/product/TDD.md:77-84`).
- TDD cost formula prices input and output tokens separately (`docs/product/TDD.md:111-120`).

Code status:
- `/api/demo/report` returns only a subset (`gateway/main.py:372-411`).
- It does not include baseline spend, p95 latency, average latency, top apps by spend, scenario counts, manual cost avoided, or started/ended timestamps.
- Cache avoided still sums prompt plus completion tokens and prices them as input tokens only (`gateway/main.py:388-390`).
- The dashboard overview uses the same approximation (`gateway/main.py:257-260`).

Impact:
The report is useful as a rough session summary, but it does not satisfy the technical artifact and can be challenged on savings accuracy.

Recommended fix:
Compute baseline cost with `tokens_prompt` and `tokens_completion` separately. Add the missing fields or revise TDD to the smaller report contract.

### P1 - Documented Demo Controls Are Still Incomplete

Product contract:
- PRD lists generate test traffic, pause/resume simulation, refresh dashboard, export report, replay prompt, clear cache, and adjustable cache threshold (`docs/product/PRD.md:65-75`).
- TDD lists traffic start/pause/resume and clear-cache/report APIs (`docs/product/TDD.md:68-84`).

Code status:
- Clear cache and export report are now present (`web/src/app/controls/page.tsx:28-40`, `gateway/main.py:362-411`).
- Traffic start/pause/resume endpoints are still missing.
- Manual refresh is still missing; Overview and RequestStream only poll (`web/src/app/page.tsx:17-29`, `web/src/components/RequestStream.tsx:18-32`).
- The threshold slider is still disabled and marked visual-only (`web/src/app/controls/page.tsx:115-121`).

Impact:
The operator control surface remains partially implemented relative to the docs.

Recommended fix:
For demo readiness, either implement traffic controls/manual refresh/threshold update or explicitly move them to optional/future scope in PRD/TDD/UX.

### P2 - Apps Page Has Partial Actions

Code status:
- `Edit Limit` now patches limits through prompt dialogs (`web/src/app/apps/page.tsx:23-30`, `web/src/app/apps/page.tsx:83`).
- `Copy Key` is still inert (`web/src/app/apps/page.tsx:84`).
- `PATCH /api/apps/{app_id}/limits` returns `{"status": "ok"}` even if the app id does not exist (`gateway/main.py:346-354`).

Impact:
This is no longer a core blocker, but visible inert controls are poor demo hygiene.

Recommended fix:
Either wire `Copy Key` to copy the seeded demo key for each app, or remove it. Return 404 when `PATCH` updates no rows, and validate RPM/budget bounds.

## Readiness Assessment

Close, but not ready to call done.

The critical fixes are small and concrete:

1. Keep the manual prompt available for immediate second submit and ensure the detail drawer opens in the intended page.
2. Fix replay authentication after hashed key storage.
3. Fix `npm run build`.
4. Align report fields/cost formula with TDD or reduce the TDD contract.
5. Decide whether traffic controls/manual refresh/threshold are implemented now or moved out of MVP.

After those are handled, this should be ready for a functional demo pass in the browser.
