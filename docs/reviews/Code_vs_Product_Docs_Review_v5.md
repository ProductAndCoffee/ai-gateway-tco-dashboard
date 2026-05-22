# Code vs Product Docs Review v5

Date: 2026-05-16  
Scope: Re-review after v4 comment fixes

## Executive Summary

The recent changes resolved the main v4 comments. The implementation now passes the local quality gates, product docs mostly reflect the adjusted MVP scope, and the code supports the core interview demo: manual prompt miss/hit, live stream, request detail drawer on Overview, scenarios, reset, clear cache, report export, app limits, and replay.

I would treat the project as technically near-ready. The remaining items are documentation precision and small UI polish gaps, not core implementation blockers.

## Verification

- Backend compile passed: `python3 -m py_compile gateway/main.py gateway/router.py gateway/db.py gateway/vector.py gateway/scenarios.py`
- Frontend lint passed: `npm run lint`
- Frontend production build passed: `npm run build`

## Resolved Since v4

- PRD now scopes manual prompts to `support-bot` for MVP (`docs/product/PRD.md:36-39`).
- PRD scenario 3 now matches the code: 12 requests against a 10 RPM limit (`docs/product/PRD.md:56-63`, `gateway/scenarios.py:28-33`).
- UX export flow now says JSON download, matching the code (`docs/product/UX_Guide.md:35-37`, `web/src/app/controls/page.tsx:33-41`).
- UI guide removed pause/resume and now lists Refresh Data as the secondary action (`docs/product/UI_Design_Guide.md:49-52`).
- Apps page no longer shows the inert Copy Key action (`web/src/app/apps/page.tsx:81-84`).

## Remaining Findings

### P1 - TDD Still Expects Manual Console Live-Data Bypass

Product mismatch:
- TDD still says to test `live-data-query` bypass in the console validation test (`docs/product/TDD.md:125-130`).
- PRD now explicitly scopes manual prompts to `support-bot` only (`docs/product/PRD.md:36-39`).
- ManualConsole is hardcoded to `support-bot` (`web/src/components/ManualConsole.tsx:10-13`).

Impact:
This is a direct artifact contradiction. A developer writing tests from the TDD would create a failing console test for a feature now descoped from the UI.

Recommended fix:
Change the TDD console validation bullet to cover empty prompt only, and state that live-data bypass is verified through Scenario 4.

### P2 - UI Design Guide Still Mentions Removed Apps Actions

Product mismatch:
- UI guide says Apps has simulated "Edit Limit", "Revoke Key", and "Copy Key" actions (`docs/product/UI_Design_Guide.md:54-58`).
- Code only shows `Edit Limit` (`web/src/app/apps/page.tsx:81-84`).

Impact:
This is no longer a code issue, but the design guide still describes controls that are not visible.

Recommended fix:
Update the UI guide to list only `Edit Limit`, or explicitly mark Revoke/Copy as future visual-only ideas not present in MVP.

### P2 - Threshold Slider Wording Is Still Ambiguous

Product mismatch:
- PRD says the slider "Adjusts precision/recall tradeoff directly" and then says it is visual-only for MVP (`docs/product/PRD.md:65-73`).
- Code correctly renders it disabled and visual-only (`web/src/app/controls/page.tsx:116-122`).

Impact:
The implementation is fine, but the PRD sentence still reads like active behavior before qualifying it.

Recommended fix:
Rewrite the bullet as: "Cache Similarity Threshold Slider: Disabled MVP visual prop showing the configured threshold; active adjustment is a future extension."

### P2 - Row Flash States Are Documented But Not Implemented

Product expectation:
- UX and UI guides mention rows flashing blue/green on manual miss/hit (`docs/product/UX_Guide.md:43-50`, `docs/product/UI_Design_Guide.md:42-46`).

Code status:
- `RequestStream` renders status badges but does not apply a transient flash/highlight class for newly inserted rows (`web/src/components/RequestStream.tsx:76-90`).

Impact:
The demo still works because badges update and the drawer opens, but the visual "flash" behavior is not present.

Recommended fix:
Either add a short-lived highlight for the latest manual request or soften the docs to say the row displays the corresponding badge.

## Readiness Assessment

Near-ready for a live demo after minor artifact cleanup.

The code is in a much stronger state than the first review: quality gates pass, core flows are implemented, and most scope mismatches are resolved. I would clean up the remaining doc contradictions before sharing the artifacts with a team or interviewer, then do one browser smoke test of reset, manual miss/hit, scenario run, replay, app limit edit, and report download.
