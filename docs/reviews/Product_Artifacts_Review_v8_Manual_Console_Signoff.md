# Product Artifacts Review v8: Manual Console Signoff

## 1. Review Context

This review checks the product artifacts after the v7 Manual Prompt Console comments were addressed.

Reviewed files:

- `docs/product/PRD.md`
- `docs/product/TDD.md`
- `docs/product/UX_Guide.md`
- `docs/product/UI_Design_Guide.md`
- `docs/product/Interview_Prep.md`

## 2. Overall Assessment

The Manual Test Console is now documented well enough for MVP implementation.

The feature has moved from a good idea to a buildable interaction. It is covered at the right levels:

- Product scope and acceptance criteria
- Default app behavior
- Cache bypass behavior
- Safety helper text
- Gateway contract
- Exact-repeat cache hit guarantee
- Report fields
- Console tests
- UX journey
- UI states
- Interview demo script

This is a strong portfolio enhancement.

## 3. v7 Comment Resolution

### Resolved: Manual prompt API contract

The TDD now clarifies that the Manual Test Console uses the selected seeded app's API key and calls `POST /v1/chat/completions` directly.

This is a clean choice because it proves the console uses the same gateway path as app traffic.

### Resolved: Exact-repeat manual prompt behavior

The TDD now states that exact repeated prompts from the same app produce a cache hit regardless of embedding variance, assuming the app is cache-eligible.

This protects the live interview demo from nondeterministic vector-search behavior.

### Resolved: Default app context

The PRD and UI guide now define `support-bot` as the default manual console app.

The PRD also states that selecting `live-data-query` enforces cache bypass.

### Resolved: Manual prompt UI/UX states

The UX guide now covers:

- Safety helper text
- Empty prompt validation
- First submit blue `[CACHE MISS]` flash
- Second identical submit green `[CACHE HIT]` flash
- Detail drawer auto-open

The UI guide now covers:

- App selector
- Prompt input
- Send button
- Empty/error state
- Sending state
- Submitted miss state
- Submitted hit state

### Resolved: Manual prompt tests

The TDD now includes console tests for:

- First submit creates request row
- Exact repeat returns cache hit
- Response includes `request_id`
- Empty prompt validation
- `live-data-query` bypass

### Resolved: Manual prompt report fields

The TDD report fields now include:

- `scenario_request_count`
- `manual_prompt_count`
- `manual_cache_hits`
- `manual_cost_avoided`

This makes the export report reflect the live interaction.

### Resolved: Demo script timing

The interview prep now calls it a `3-4 Minute Demo Script`, which matches the added manual prompt segment.

## 4. Remaining Minor Polish

### P3: Add manual console placement to IA

The UX information architecture still lists:

- Overview
- Live Traffic
- Apps
- Settings / Demo Controls

It does not explicitly state where the Manual Test Console lives.

Recommended update:

Add one sentence under IA:

```text
Manual Test Console appears in Settings / Demo Controls and may also be exposed as a compact quick-entry panel on Overview.
```

This is minor and can also be decided during UI implementation.

### P3: UI states could mention cache bypass and rate-limited manual submissions

The UI guide covers empty/error, sending, submitted miss, and submitted hit. Since the app selector supports `live-data-query`, add:

- Submitted bypass: row flashes slate `[CACHE BYPASS]`
- Rate limited: row flashes amber `[THROTTLED - 429]`

This is small, but it completes the console state model.

## 5. Final Recommendation

Proceed to implementation.

The manual console should be treated as a first-class MVP feature, not a later enhancement.

Recommended implementation behavior:

1. Default app selector to `support-bot`.
2. Disable send for empty prompt.
3. On submit, call `POST /v1/chat/completions` using the selected seeded app key.
4. Append row to live stream immediately after response.
5. Auto-open request detail drawer using returned `request_id`.
6. On exact repeat under same app, guarantee cache hit.
7. Animate KPI changes, especially cost avoided and latency.

## 6. Final Verdict

Ready.

The manual console makes the project materially stronger and is now sufficiently documented to build.
