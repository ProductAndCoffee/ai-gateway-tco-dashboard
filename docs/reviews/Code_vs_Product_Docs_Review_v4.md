# Code vs Product Docs Review v4

Date: 2026-05-16  
Scope: Re-review after recent comment fixes  
Baseline: Follow-up to `Code_vs_Product_Docs_Review_v3.md`

## Executive Summary

The recent fixes addressed the main v3 implementation concerns. The code now builds cleanly, the inert Copy Key action was removed, export cleanup was improved, Overview is documented as the canonical manual-demo location, and the TDD report field list now matches the implemented report shape.

The project is close to demo-ready. Remaining comments are mostly documentation precision and a few product/code mismatches that could create reviewer confusion.

## Verification

- Backend compile passed: `python3 -m py_compile gateway/main.py gateway/router.py gateway/db.py gateway/vector.py gateway/scenarios.py`
- Frontend lint passed: `npm run lint`
- Frontend production build passed: `npm run build`

## Resolved Since v3

- `Copy Key` was removed from Apps actions, so there is no longer a visible inert button (`web/src/app/apps/page.tsx:81-84`).
- Export report now revokes the object URL after download (`web/src/app/controls/page.tsx:33-41`).
- UX now defines Overview as the canonical location for manual prompt demonstration and manual dashboard refresh (`docs/product/UX_Guide.md:52-56`).
- TDD report fields were reduced to the implemented MVP report shape (`docs/product/TDD.md:68-81`).
- Production build now passes.

## Remaining Findings

### P1 - Manual Console App Selector Is Still Documented But Not Implemented

Product contract:
- PRD says the manual prompt context selector defaults to `support-bot`, and selecting `live-data-query` enforces cache bypass (`docs/product/PRD.md:36-39`).

Code status:
- Manual console is hardcoded to `support-bot` and `key_1` (`web/src/components/ManualConsole.tsx:10-13`).
- There is no app selector in the manual console UI.

Impact:
The core miss-then-hit demo works for `support-bot`, but the manual console cannot demonstrate the documented `live-data-query` bypass behavior. This is a doc/code mismatch.

Recommended fix:
Either add a small app selector to `ManualConsole`, or update the PRD to state that manual prompting is fixed to `support-bot` for MVP and live-data bypass is demonstrated through Scenario 4.

### P1 - UI Design Guide Still Mentions Descoped Pause/Resume

Product scope:
- Traffic pause/resume has been descoped.

Doc mismatch:
- UI guide still lists "Pause/Resume Traffic" as a secondary action (`docs/product/UI_Design_Guide.md:49-52`).

Impact:
Design and implementation no longer agree. A team member using the UI guide would still expect pause/resume controls.

Recommended fix:
Remove this line or explicitly mark pause/resume as a future/non-MVP action.

### P2 - Threshold Slider Wording Is Still Slightly Contradictory

Product scope:
- Threshold slider is a disabled visual prop for MVP.

Doc mismatch:
- PRD says the slider "Adjusts precision/recall tradeoff directly on the dashboard" and then adds "(Visual only for MVP)" (`docs/product/PRD.md:65-73`).
- Code correctly renders a disabled visual-only slider (`web/src/app/controls/page.tsx:115-122`).

Impact:
This is not a code issue, but the sentence reads like active behavior and then retracts it.

Recommended fix:
Rewrite as: "Cache Similarity Threshold Slider: Disabled MVP visual prop showing the configured threshold; active adjustment is a future extension."

### P2 - Scenario 3 Request Count Differs Between PRD and Code

Product contract:
- PRD describes `scenario_3` as a burst of 50 short prompts (`docs/product/PRD.md:56-63`).

Code status:
- Scenario 3 sends 12 prompts against a 10 RPM limit (`gateway/scenarios.py:28-33`).

Impact:
The implementation is more demo-efficient and still triggers 429, but the deterministic fixture in the PRD is inaccurate.

Recommended fix:
Update the PRD to "Burst of 12 short prompts" or update the scenario generator to send 50.

### P2 - Export UX Says Printable Modal, Code Downloads JSON

Product docs:
- UX says export opens a lightweight printable modal and is also available as JSON (`docs/product/UX_Guide.md:35-37`).

Code status:
- Demo Controls downloads `demo-report.json` directly (`web/src/app/controls/page.tsx:33-41`).

Impact:
The export is functional and matches the TDD JSON endpoint, but the UX expectation is broader than the implementation.

Recommended fix:
Either add the printable modal later, or adjust UX to state that MVP export is JSON-only.

## Readiness Assessment

Technically close to ready. The implementation now passes the core local quality gates and supports the main demo flow.

Before final signoff, clean up the remaining doc/code mismatches so reviewers do not expect controls or flows that are intentionally outside the MVP. The only implementation decision still worth making is whether to add a manual app selector or explicitly scope manual prompts to `support-bot`.
