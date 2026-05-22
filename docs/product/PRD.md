# Product Requirements Document (PRD): AI Gateway Simulator: Semantic Caching, Model Routing, and Cost Observability

## 1. Executive Summary
The AI Gateway Simulator is a focused portfolio project demonstrating enterprise-grade AI infrastructure patterns. It showcases how a centralized proxy can reduce LLM spend and improve operational control by routing requests to appropriate models, serving repeated work from a semantic cache, enforcing app-level limits, and visualizing cost and latency in real time.

## 2. Portfolio Scope & Demo Goals
- **Personal Project:** This is a personal portfolio project and simulation, not a deployed enterprise gateway.
- **Synthetic Traffic & Hybrid Execution:** The project explicitly uses synthetic data and mock apps. Execution runs in a "Hybrid" mode: embeddings and routing logic are real, but chat completions are mocked by default to ensure demo reliability (real provider calls can be enabled via environment flag).
- **Goal:** Success is measured by demo clarity, technical depth, and explainability to technical interviewers and product leaders.
- **Future Hardening:** Production concerns (HA, failover, full RBAC) are documented separately as future hardening considerations.

## 3. Core Demo Thesis
> This project demonstrates how an AI gateway can reduce LLM spend and improve operational control by routing requests to appropriate models, serving repeated work from a semantic cache, enforcing app-level limits, and visualizing cost and latency in real time.

## 4. Problem Statement
As AI adoption scales across teams, companies face:
- **Cost Explosion:** Defaulting to expensive models (e.g., GPT-4) for simple tasks.
- **Redundancy:** Paying multiple times for the exact same query without a caching mechanism.
- **Lack of Observability:** No centralized way to track API costs, rate limits, and latency across different product teams.

## 5. Target Audience (Personas)
- **VPs of Engineering / Head of AI (The Buyers):** Seek budget control and operational visibility.
- **PMs & Engineering Leads (The Operators):** Need easy API key generation and reliable AI infrastructure.
- **Interviewer / Evaluator (The Audience):** Needs to understand the system quickly, see AI infrastructure behavior in real time, inspect routing/caching/cost decisions, and assess tradeoff awareness.

## 6. MVP Scope (Demoable Features) & Acceptance Criteria
- **Semantic Caching:** Intercept redundant queries using similarity search. 
  - *Acceptance:* Replaying a similar prompt returns `cache_hit=true`, displays a similarity score, shows near-zero latency, and increments cost avoided.
- **Dynamic Routing:** Route requests based on task type or prompt length.
  - *Acceptance:* At least two different request types visibly route to different models, and the UI displays the routing reason.
- **Rate Limiting:** Enforce quotas for noisy apps.
  - *Acceptance:* App C receives `HTTP 429` after exceeding its configured RPM limit.
- **Cost Observability:** Calculate and display "Cost Avoided".
- **Live Traffic Simulation:** Python scripts to generate realistic traffic patterns.
- **Dashboard:** A UI showing live requests, latency, cache hits, routing decisions, and spend.
- **Interactive Manual Prompting:** Allow presenter to type arbitrary prompts.
  - *Acceptance:* Submitting the same manual prompt twice produces a cache miss followed by a cache hit, updates live metrics, and opens the latest request detail drawer.
  - *Scope:* Manual prompts are explicitly scoped to the `support-bot` application context for the MVP.
  - *Safety:* Manual prompts must be safe for demo logs. The UI displays helper text: "Do not enter secrets or personal data."
- **Demo Reset:** 
  - *Acceptance:* Clicking "Reset Demo" successfully clears the request stream, metrics, alerts, and cache state to start fresh, and restores seeded settings.
- **Export Report:**
  - *Acceptance:* Produces a summary containing total requests, cache hit rate, actual spend, estimated cost avoided, and throttled request count.

### Future Extensions (Out of Scope for MVP)
- PII redaction
- Provider failover (Provider health toggle in UI is visual-only for MVP)
- Complex RBAC and enterprise authentication
- Full audit logging
- Slack/email alerting
- Production deployment and High Availability (HA)

## 7. Deterministic Demo Scenarios & Prompt Fixtures
To make the interview demo predictable and testable, specific scenarios and exact prompts are defined below:

| Scenario ID | Order | App ID | Prompt | Task Type | Expected Cache | Expected Model | Expected Badge |
|-------------|-------|--------|--------|-----------|----------------|----------------|----------------|
| `scenario_1`| 1     | `support-bot` | "How do I reset my workspace password?" | `faq` | Cache Miss | `gemini-flash-class` | `[CACHE MISS]` |
| `scenario_1`| 2     | `support-bot` | "What is the process to change my workspace password?" | `faq` | Cache Hit | `cache` | `[CACHE HIT]` |
| `scenario_2`| 1     | `content-tool` | "Categorize this text into one of three buckets: [text]" | `classification` | Cache Miss | `gemini-flash-class` | `[ROUTED]` |
| `scenario_2`| 2     | `content-tool` | "Analyze the following 10-page financial report and infer the strategic shift of the company: [text]" | `analysis` | Cache Miss | `gpt-4-class` | `[ROUTED]` |
| `scenario_3`| 1-12  | `rogue-app` | Burst of 12 short prompts | `general` | Cache Miss | None | `[THROTTLED - 429]` |
| `scenario_4`| 1     | `live-data-query` | "Fetch the latest real-time stock price for AAPL" | `live-data` | Cache Bypass | `gpt-4-class` | `[CACHE BYPASS]` |

## 8. Demo Controls (Operator Features)
To ensure a reliable live demo, the system includes:
- **Reset Demo:** Clears logs, cache, metrics, alerts, and app usage.
- **Run Scenario:** One-click presets to trigger Scenarios 1-4.
- **Clear Cache:** Demonstrates a before/after of cache misses vs hits.
- **Refresh Dashboard:** Manual and auto-refresh toggles.
- **Replay Prompt:** Replays a specific request deterministically.
- **Export Demo Report:** Generates a lightweight summary of the run.
- **Cache Similarity Threshold Slider:** Disabled MVP visual prop showing the configured threshold; active adjustment is a future extension.

### Advanced Controls (Optional Extensions)
- **Routing Policy Selector:** Toggles between cost-optimized and latency-optimized defaults.
- **Provider Health Toggle:** Simulates provider outages (visual state only for MVP).
