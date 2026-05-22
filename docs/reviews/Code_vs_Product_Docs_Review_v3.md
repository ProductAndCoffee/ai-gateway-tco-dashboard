# Code vs Product Docs Review v3

Date: 2026-05-16  
Scope: Code re-review after scope clarification  
Adjusted scope used for this review:
- Traffic pause/resume is descoped.
- Cache threshold slider remains a disabled visual prop.
- Manual refresh is expected as a frontend "Refresh Data" action that immediately reloads the dashboard polling data.

## Executive Summary

The code is now substantially closer to demo-ready. The prior build issue is resolved, replay authentication has been fixed, the manual prompt remains in the field for immediate repeat submission, and the Overview refresh button reloads both KPI and request-stream data.

The remaining issues are mostly contract clarity and demo polish rather than foundational architecture. The largest risk is that the docs and UI still send mixed signals: some descoped controls are still described as active product behavior, and some visible UI actions remain partial. The code can support a strong demo after a small cleanup pass.

## Verification

- Backend compile passed: `python3 -m py_compile gateway/main.py gateway/router.py gateway/db.py gateway/vector.py gateway/scenarios.py`
- Frontend lint passed: `npm run lint`
- Frontend production build passed when run outside sandbox: `npm run build`
  - The sandboxed run failed because Turbopack attempted to bind an internal worker port. The escalated run completed successfully.

## Resolved Since v2

- Manual prompt is no longer cleared after submission, allowing immediate repeat submit (`web/src/components/ManualConsole.tsx:25-28`).
- Replay no longer sends the stored hashed API key. It now passes `app_id` and maps to seeded raw demo keys (`gateway/main.py:450-461`, `gateway/scenarios.py:71-97`).
- `Sidebar` is correctly marked as a client component (`web/src/components/ui/Sidebar.tsx:1-6`).
- Google font dependency was removed from layout, avoiding remote font fetch during build (`web/src/app/layout.tsx:1-18`).
- Cost avoided now prices prompt and completion tokens separately in overview and report (`gateway/main.py:257-263`, `gateway/main.py:393-403`).
- App-limit patch now returns 404 when the app id does not exist (`gateway/main.py:348-359`).
- Manual refresh exists on Overview and triggers both metrics and live-request reloads (`web/src/app/page.tsx:17-40`, `web/src/components/RequestStream.tsx:18-39`).

## Remaining Findings

### P1 - Product Docs Still Contradict the New Scope

The code now matches the clarified scope better than the docs do.

Conflicts:
- PRD still says pause/resume simulation is included (`docs/product/PRD.md:70`).
- UI guide still lists "Pause/Resume Traffic" as a secondary action (`docs/product/UI_Design_Guide.md:51`).
- PRD still says the threshold slider adjusts precision/recall directly (`docs/product/PRD.md:73`).
- UX still describes a live threshold-adjustment journey (`docs/product/UX_Guide.md:39-41`).

Code status:
- No pause/resume traffic controls exist, which is correct under the new scope.
- Threshold is disabled and marked visual-only (`web/src/app/controls/page.tsx:115-121`), which is correct under the new scope.

Impact:
An implementation reviewer reading the product docs will still expect behavior the code intentionally does not implement.

Recommended fix:
Update PRD, UX, and UI guide to explicitly state pause/resume is descoped and threshold is visual-only for MVP.

### P1 - Report Endpoint Still Does Not Fully Match the TDD Contract

Product contract:
- TDD lists `scenario_run_id`, `started_at`, `ended_at`, `scenario_request_count`, `cache_hits`, `throttled_requests`, and `top_apps_by_spend` among report fields (`docs/product/TDD.md:84`).

Code status:
- Report includes spend, baseline spend, routing savings, manual metrics, average latency, and p95 latency (`gateway/main.py:377-441`).
- It still omits `scenario_run_id`, `started_at`, `ended_at`, `scenario_request_count`, `cache_hits`, and `top_apps_by_spend`.
- It returns `throttled_count`, not the documented `throttled_requests` (`gateway/main.py:438`).

Impact:
The export works, but it is not contract-complete. This matters if the report is used as a team-facing artifact or interview proof point.

Recommended fix:
Either add the remaining fields or reduce the TDD report contract to the fields actually exported.

### P1 - Manual Console Drawer Behavior Is Page-Dependent

Product contract:
- Manual prompt acceptance says the latest request detail drawer opens after manual submission (`docs/product/PRD.md:36-38`).
- UX says the Manual Test Console may appear in Demo Controls and Overview (`docs/product/UX_Guide.md:61`).

Code status:
- The console dispatches `manual-prompt-sent` (`web/src/components/ManualConsole.tsx:25-28`).
- `RequestStream` listens and opens the drawer (`web/src/components/RequestStream.tsx:12-16`).
- Overview has both the console and stream, so this works there (`web/src/app/page.tsx:45-79`).
- Demo Controls has the console but no `RequestStream`, so no drawer opens there (`web/src/app/controls/page.tsx:151-155`).

Impact:
The manual demo works correctly from Overview, but not from Demo Controls. That is fine if the intended demo path is Overview; the docs should say that.

Recommended fix:
Make Overview the canonical manual demo location in the docs, or add a compact request stream/detail drawer to Demo Controls.

### P2 - Manual Refresh Is Implemented Only on Overview

Code status:
- Overview "Refresh Data" dispatches a shared event and refreshes KPI plus stream data (`web/src/app/page.tsx:38-52`).
- Live Traffic also has a `RequestStream`, but no visible refresh button on that page (`web/src/app/traffic/page.tsx:5-12`).
- Apps page still relies only on polling and has no manual refresh (`web/src/app/apps/page.tsx:9-20`).

Impact:
This satisfies the main dashboard use case, but the action is not global. If "Refresh Dashboard" means only Overview, this is acceptable. If it means every data page, the control is incomplete.

Recommended fix:
Either document "Refresh Data" as an Overview action or extract a reusable refresh control for Live Traffic and Apps.

### P2 - Some Visible UI Actions Remain Partial

Code status:
- Apps `Edit Limit` is functional, though implemented with browser prompts (`web/src/app/apps/page.tsx:23-30`, `web/src/app/apps/page.tsx:83`).
- Apps `Copy Key` is still visible but has no handler (`web/src/app/apps/page.tsx:84`).
- Export report downloads JSON but does not revoke the object URL afterward (`web/src/app/controls/page.tsx:33-40`).

Impact:
These are not blockers, but visible inert controls reduce polish during a live walkthrough.

Recommended fix:
Wire `Copy Key` to copy the seeded key or remove it. Revoke the object URL after export. Replace prompt dialogs with a small modal only if time allows.

## Readiness Assessment

Conditionally ready after documentation cleanup and one small UI cleanup pass.

For the adjusted MVP scope, the implementation is now functionally close. Before calling it done, update the product docs to match the descoped pause/resume and disabled threshold slider, decide whether the manual drawer behavior is Overview-only, and remove or wire the inert Copy Key button.
