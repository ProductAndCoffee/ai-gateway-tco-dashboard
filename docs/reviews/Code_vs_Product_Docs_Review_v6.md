# Code vs Product Docs Review v6

Date: 2026-05-16  
Scope: Re-review after v5 comment fixes

## Executive Summary

The v5 findings are largely resolved. The implementation passes the backend and frontend quality gates, and the product artifacts now align closely with the MVP behavior. The core demo path is credible: reset, manual prompt miss/hit, request detail drawer on Overview, scenario runs, replay, cache clear, app limit edit, dashboard refresh, and JSON report export.

I found one remaining documentation inconsistency. It is not a code blocker, but it should be fixed before calling the artifacts final.

## Verification

- Backend compile passed: `python3 -m py_compile gateway/main.py gateway/router.py gateway/db.py gateway/vector.py gateway/scenarios.py`
- Frontend lint passed: `npm run lint`
- Frontend production build passed: `npm run build`

## Resolved Since v5

- TDD console validation now scopes live-data bypass to Scenario 4, not Manual Console (`docs/product/TDD.md:122-130`).
- UI guide app actions now list only `Edit Limit`, matching Apps page (`docs/product/UI_Design_Guide.md:54-58`, `web/src/app/apps/page.tsx:81-84`).
- PRD threshold slider wording is now clearly visual-only for MVP (`docs/product/PRD.md:65-73`).
- UX row flash wording was softened to badge display, matching `RequestStream` behavior (`docs/product/UX_Guide.md:43-50`, `web/src/components/RequestStream.tsx:76-90`).

## Remaining Finding

### P2 - UI Guide Still Describes a Manual App Selector

Product/code mismatch:
- PRD scopes manual prompts to `support-bot` for MVP (`docs/product/PRD.md:36-39`).
- Code hardcodes Manual Console to `support-bot` and `key_1` (`web/src/components/ManualConsole.tsx:10-13`).
- UI guide still says Manual Test Console has an app selector dropdown defaulting to `support-bot` (`docs/product/UI_Design_Guide.md:36-40`).

Impact:
This is a documentation inconsistency only. A designer or frontend implementer reading the UI guide would still expect a dropdown that the MVP intentionally excludes.

Recommended fix:
Change the UI guide bullet from "App Selector" to a fixed "App Context Badge" or "Fixed App Context: `support-bot` for MVP."

## Readiness Assessment

Near-final. The code is clean against compile, lint, and build, and the demoable MVP behavior is coherent.

After fixing the UI guide app selector wording, I would mark the code and product artifacts ready for a browser smoke test and final demo rehearsal.
