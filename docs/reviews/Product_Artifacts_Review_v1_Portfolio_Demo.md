# Product Artifacts Review: AI Gateway & TCO Dashboard

## 1. Review Context

This review assumes the primary objective is to build a demoable personal portfolio project that showcases AI infrastructure, product thinking, and technical judgment to prospective interviewers.

The project should not be positioned as a fully production-ready enterprise platform. It should be positioned as a working simulation of an enterprise AI gateway that demonstrates the most important concepts visually and technically:

- Semantic caching
- Dynamic model routing
- AI API cost observability
- Rate limiting and quota enforcement
- Developer-friendly gateway integration
- Dashboard-driven operational visibility

The current artifacts are directionally strong, but they read more like an enterprise product proposal than a scoped portfolio demo. The team should update the PRD, TDD, UX guide, UI guide, and interview prep materials so they clearly support a 3-5 minute demo and a deeper technical discussion.

## 2. Recommended Product Reframe

### Current framing

AI API Gateway & TCO Dashboard

### Recommended framing

AI Gateway Simulator: Semantic Caching, Model Routing, and Cost Observability

### Why this matters

The revised framing is more honest and stronger for interviews. It tells reviewers that the project is a focused simulation of enterprise-grade AI infrastructure patterns, not an overclaimed production system. The product can still be inspired by enterprise problems, but the implementation should be scoped around what an interviewer can quickly see, run, inspect, and question.

## 3. Core Demo Thesis

The artifacts should align around this thesis:

> This project demonstrates how an AI gateway can reduce LLM spend and improve operational control by routing requests to appropriate models, serving repeated work from a semantic cache, enforcing app-level limits, and visualizing cost and latency in real time.

This thesis should appear in the PRD, TDD, README, and interview prep materials.

## 4. Priority Findings

### P1: Scope is too broad for a portfolio project

The current documents include dynamic routing, semantic caching, failover, high availability, rate limiting, quotas, PII redaction, alerting, API key generation, audit logs, vendor fallback, and full dashboard analytics.

For a portfolio demo, this creates risk. A shallow implementation of many features will be less impressive than a polished implementation of a few meaningful ones.

Recommended MVP:

- Semantic cache with similarity search
- Dynamic routing based on task type, prompt length, or routing policy
- Cost avoided calculation
- Rate limiting demo
- Live traffic simulation
- Dashboard showing requests, latency, cache hits, routing decisions, and spend

Recommended future extensions:

- PII redaction
- Provider failover
- RBAC
- Full audit logging
- Slack/email alerting
- Production deployment and HA

### P1: The docs need an explicit portfolio/demo scope

The PRD currently describes an internal enterprise infrastructure product. Add a section titled `Portfolio Scope & Demo Goals`.

Suggested content:

- This is a personal project and simulation, not a deployed enterprise gateway.
- The project uses mock apps and synthetic traffic to demonstrate realistic platform behavior.
- Success is measured by demo clarity, technical depth, and explainability.
- Production concerns are documented separately as future hardening.

### P1: Semantic caching needs clear safety rules

Semantic caching is the most interesting AI feature, but it is also the easiest to challenge in interviews. The docs need to show that the team understands cache correctness and risk.

Add rules such as:

- Cache only deterministic or low-risk request types.
- Partition cache entries by app/team.
- Use a configurable similarity threshold.
- Store prompt hash, embedding, response, routed model, timestamp, TTL, and estimated cost.
- Bypass cache for live data, user-specific data, sensitive prompts, or high-risk workflows.
- Show similarity score and cache reason in the dashboard.

### P1: Cost avoided must be explainable

The dashboard should not just display savings. It should explain how savings are estimated.

Recommended formula:

```text
cost_avoided =
  estimated_input_tokens * baseline_model_input_price
  + estimated_output_tokens * baseline_model_output_price
```

For routed requests, also track:

```text
routing_savings =
  baseline_model_cost - actual_routed_model_cost
```

The dashboard should distinguish:

- Actual spend
- Projected baseline spend
- Savings from cache
- Savings from routing
- Total estimated cost avoided

### P1: The demo needs operator controls

A demoable product needs controls that reliably trigger interesting system behavior. The current artifacts describe the system, but they do not yet define enough user actions for a strong live demo.

Must-have demo controls:

- Reset demo
- Run scenario
- Generate test traffic
- Pause/resume simulation
- Clear cache
- Refresh dashboard
- Replay prompt
- Export demo report

High-value AI controls:

- Cache similarity threshold slider
- Routing policy selector
- Provider health toggle
- Model price editor
- Bypass cache toggle
- Rate limit configuration

These controls should be added to the PRD, UX guide, and UI guide.

### P2: Fail-open language should be revised

The TDD and interview prep currently describe a fail-open behavior. That is risky because it can imply bypassing auth, quotas, PII controls, and audit logging.

Recommended replacement:

> The gateway fails closed for auth, quota, and safety controls. It degrades gracefully for cache and advanced routing. If the cache is unavailable, requests continue through normal provider routing. If the routing policy engine is unavailable, the gateway uses a conservative default route.

This is more defensible in interviews.

### P2: The TDD should commit to a concrete implementation stack

The TDD currently lists multiple options. For a project plan, choose one.

Recommended stack:

- FastAPI for the gateway
- SQLite for analytics and app metadata
- SentenceTransformers for embeddings
- Local vector index using FAISS, Chroma, or a simple in-memory vector store for MVP
- Next.js dashboard if the goal is a polished portfolio UI
- Streamlit dashboard if speed of implementation is more important
- Python traffic generator scripts

If the team chooses Next.js, prioritize a polished visual demo. If the team chooses Streamlit, prioritize speed and explainability.

### P2: UX should include the interviewer as a user

The current UX guide includes enterprise personas. Keep them, but add a portfolio-specific persona:

**Interviewer / Evaluator**

Goal:

- Understand the system quickly
- See AI infrastructure behavior in real time
- Inspect routing, caching, cost, and rate-limit decisions
- Assess tradeoff awareness

Design implications:

- Prominent live request stream
- Visible cache hit/miss labels
- Visible routed model labels
- Request-level detail drawer
- One-click scenarios
- Clear before/after cost and latency comparisons

### P2: UI should prioritize explainability over visual polish

The current UI guide has an appropriate developer-tool aesthetic, but it should add specific components that reveal system behavior.

Add these components:

- Live request stream
- Cache hit/miss badge
- Similarity score display
- Routed model badge
- Cost per request
- Latency per request
- Rate-limit event row
- Provider health indicator
- Routing reason drawer
- Demo control panel

The design can still be dark, modern, and polished, but the primary goal is to make backend intelligence visible.

## 5. Recommended Product Scope

### MVP scope

The MVP should demonstrate five core workflows:

1. Generate synthetic traffic from multiple mock apps.
2. Route different prompts to different model tiers.
3. Serve repeated or similar prompts from semantic cache.
4. Enforce a rate limit against a noisy app.
5. Show cost, latency, cache, and routing outcomes in the dashboard.

### Out of scope for MVP

- Real enterprise authentication
- Multi-region availability
- Full provider abstraction layer
- Billing-grade cost reporting
- Complex RBAC
- Compliance-grade audit logging
- Production incident alerting
- Real secrets management

### Future production hardening

The team should still document these as future considerations:

- Auth and key rotation
- Prompt and response retention policy
- Encryption at rest
- Provider data retention controls
- RBAC and tenant isolation
- Production vector database
- Distributed rate limiting
- OpenTelemetry tracing
- CI/CD and deployment plan
- Security review

## 6. Recommended Demo Controls

### Primary controls

#### Reset Demo

Clears logs, cache, metrics, alerts, and app usage. This allows the demo to start from a clean baseline.

#### Run Scenario

Provides one-click presets:

- Show Semantic Cache Savings
- Show Dynamic Routing
- Show Rate Limit Breach
- Show Cost Spike
- Show Provider Failover, if implemented

#### Generate Test Traffic

Runs mock app traffic:

- App A: repetitive simple prompts to trigger semantic cache hits
- App B: long expensive prompts to show routing and cost impact
- App C: rapid spam traffic to trigger rate limits

#### Pause / Resume Simulation

Freezes or resumes event generation so the presenter can explain what happened.

#### Clear Cache

Allows a clear before/after demo:

1. First request is a cache miss.
2. Similar second request is a cache hit.
3. Dashboard shows lower latency and avoided cost.

#### Refresh Dashboard

Useful even if auto-refresh exists. Include:

- Manual refresh button
- Auto-refresh toggle
- Last updated timestamp

#### Replay Prompt

Allows the presenter to replay a prior request and show cache/routing behavior deterministically.

#### Export Demo Report

Creates a lightweight summary with:

- Total requests
- Cache hit rate
- Actual spend
- Estimated cost avoided
- Average latency
- Throttled requests
- Top apps by usage

### Advanced controls

#### Cache Similarity Threshold

A slider such as:

- 0.80: more aggressive caching
- 0.90: balanced
- 0.95: conservative

This is useful for discussing precision/recall tradeoffs.

#### Routing Policy Selector

Options:

- Cost optimized
- Latency optimized
- Quality optimized
- Balanced

#### Provider Health Toggle

Allows the user to simulate provider outages.

#### Model Price Editor

Lets the presenter adjust model prices and show how TCO changes.

#### Bypass Cache Toggle

Shows what spend and latency look like without semantic caching.

#### Rate Limit Config

Allows configuration per mock app:

- Requests per minute
- Token budget
- Spend cap

## 7. Recommended Dashboard Views

### Overview

Purpose:

Show the value proposition immediately.

Include:

- Total requests
- Actual spend
- Estimated cost avoided
- Cache hit rate
- Average latency
- Rate-limited requests
- Active provider health

### Live Traffic

Purpose:

Make the gateway behavior visible.

Include:

- Timestamp
- App
- Prompt type
- Cache hit/miss
- Similarity score
- Routed model
- Cost
- Latency
- Status code

### Request Detail

Purpose:

Support deeper interview discussion.

Include:

- Prompt
- Response summary
- Cache decision
- Routing decision
- Policy applied
- Similarity score
- Token estimate
- Cost calculation
- Latency breakdown

### Apps

Purpose:

Show platform controls.

Include:

- App name
- API key status
- Request count
- Spend
- Budget
- Rate limit
- Status

### Settings / Demo Controls

Purpose:

Let the presenter control scenarios.

Include:

- Reset demo
- Scenario selector
- Traffic generator controls
- Routing policy
- Cache threshold
- Provider health
- Model pricing

## 8. Artifact-by-Artifact Update Plan

### PRD.md

Add:

- Portfolio Scope & Demo Goals
- Core demo thesis
- MVP vs future scope
- Demo controls
- Success metrics for portfolio evaluation

Revise:

- Reduce enterprise production claims
- Clarify that traffic is synthetic
- Make cost avoided and semantic cache behavior more specific

Suggested success metrics:

- Demo can be understood in under 5 minutes.
- Semantic cache visibly reduces repeated request latency.
- Dashboard shows actual spend vs estimated baseline spend.
- Rate limit behavior can be triggered on demand.
- Routing decisions are explainable at request level.

### TDD.md

Add:

- Concrete stack decision
- Data model
- Cache eligibility rules
- Cost calculation model
- Routing policy model
- Scenario runner architecture
- Failure and degradation matrix

Revise:

- Replace fail-open with graceful degradation.
- Separate MVP architecture from production hardening.
- Clarify which provider calls are real, mocked, or configurable.

Recommended data tables:

- apps
- requests
- cache_entries
- model_prices
- scenario_runs
- alerts

### UX_Guide.md

Add:

- Interviewer/evaluator persona
- Demo operator journey
- One-click scenario flows
- Request inspection workflow
- Empty state and reset state behavior

Revise:

- Align navigation with UI guide.
- Make the dashboard useful for both product buyers and demo viewers.

### UI_Design_Guide.md

Add:

- Demo control panel
- Live request stream
- Routing/caching badges
- Request detail drawer
- Provider health controls
- Cost calculation display
- Visual states for cache hit, cache miss, routed, throttled, and failed

Revise:

- Prioritize operational clarity over decorative polish.
- Avoid overusing glassmorphism if it hurts table readability.

### interview_prep.md

Add:

- 3-minute demo script
- 10-minute deep-dive script
- Production hardening section
- Tradeoff discussion
- Build-vs-buy answer
- Failure mode answer

Revise:

- Replace fail-open answer.
- Make the project pitch clear that this is a simulation.

## 9. Suggested 3-Minute Demo Script

### 0:00-0:30: Setup

Open the dashboard in a clean state.

Say:

> This is a simulated AI gateway that sits between internal apps and LLM providers. It demonstrates semantic caching, dynamic routing, rate limiting, and cost observability.

### 0:30-1:15: Semantic caching

Run the semantic cache scenario.

Show:

- First request is a cache miss.
- Similar second request is a cache hit.
- Latency drops.
- Cost avoided increases.

### 1:15-2:00: Dynamic routing

Run the routing scenario.

Show:

- Simple prompts route to cheaper model.
- Complex prompts route to stronger model.
- Dashboard explains routing reason.
- Cost comparison updates.

### 2:00-2:30: Rate limiting

Run the noisy app scenario.

Show:

- App C exceeds quota.
- Gateway returns HTTP 429.
- Alert appears in dashboard.

### 2:30-3:00: Wrap

Show the final metrics.

Say:

> The goal is not to recreate a full enterprise gateway, but to prove the core infrastructure pattern: centralize AI traffic, make routing and cache decisions visible, and quantify cost/latency tradeoffs.

## 10. Suggested 10-Minute Deep Dive

Use this for technical interview follow-up:

1. Explain architecture.
2. Walk through a request lifecycle.
3. Explain semantic cache threshold and tenant partitioning.
4. Explain routing policy.
5. Explain cost calculation.
6. Discuss rate limiting.
7. Discuss production hardening.
8. Discuss build-vs-buy tradeoffs.
9. Discuss evaluation and correctness risks.
10. Show code structure.

## 11. Interviewer Questions to Prepare For

### Semantic caching

- How do you avoid returning the wrong cached answer?
- What similarity threshold did you choose and why?
- Which prompts should never be cached?
- How do you handle stale data?

### Routing

- How do you classify prompt complexity?
- How do you know cheaper models are good enough?
- Can teams override the router?
- How would you evaluate quality regressions?

### Cost

- How do you calculate cost avoided?
- How do you account for cached completion tokens?
- How do you handle model price changes?
- Is this billing-grade or directional?

### Reliability

- What happens if the cache is down?
- What happens if a provider is down?
- What fails closed?
- What degrades gracefully?

### Product strategy

- Why build this instead of using Cloudflare AI Gateway, LiteLLM, Helicone, or Portkey?
- Who owns this internally?
- How do you drive adoption?
- What is the smallest useful version?

## 12. Recommended Next Steps

1. Update PRD with portfolio scope, demo thesis, MVP scope, and demo controls.
2. Update TDD with concrete stack, data model, cache rules, routing rules, and cost formula.
3. Update UX guide with interviewer persona and demo journeys.
4. Update UI guide with live request stream, controls, badges, and request detail drawer.
5. Update interview prep with demo scripts and revised failure-mode answers.
6. Build the MVP around deterministic scenarios before adding optional production-style features.

## 13. Final Recommendation

The project idea is strong for interviews because it shows AI platform thinking beyond chatbot UI work. The artifacts should now be tightened around a focused, demoable implementation.

The strongest version of this project is not a broad mock enterprise platform. It is a polished AI gateway simulation where every major concept can be triggered, inspected, explained, and defended in a short interview demo.
