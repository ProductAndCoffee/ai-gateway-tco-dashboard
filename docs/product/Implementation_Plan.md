# Implementation Plan: AI Gateway Simulator MVP

This document outlines the step-by-step build sequence to implement the AI Gateway Simulator based on the finalized product artifacts and Figma designs. 

Yes, we can absolutely push this to GitHub and deploy it live on the internet! We will design the architecture specifically to be cloud-deployable.

## User Review Required
Please review the deployment strategy and phase order. Once approved, I will begin Phase 1 immediately.

> [!TIP]
> **The Stateless Demo Advantage**
> Because this is a simulator, we *want* the system to reset to a clean state. When we deploy the backend to a service like Render, the SQLite database and FAISS index will live in the container's ephemeral memory. When the server goes to sleep or redeploys, it automatically wipes the logs and restores our clean "Seed Data" state. This means your public demo link will always be fresh and ready for an interview, with zero maintenance!

## Architecture & Deployment Strategy

We will use a monorepo structure to keep everything in one place for GitHub.

```text
ai-gateway-tco-dashboard/
├── web/                # Next.js Frontend (Deployed to Vercel)
│   ├── components/     # UI Components (KPIs, Request Stream)
│   ├── app/            # Next.js Pages & API proxy routes
│   └── lib/            # Utility functions
├── gateway/            # FastAPI Backend (Deployed to Render or Railway)
│   ├── main.py         # FastAPI App Entrypoint
│   ├── db.py           # SQLite Schema & Seed logic
│   ├── vector.py       # FAISS Index & SentenceTransformers
│   ├── router.py       # Routing Policy Engine
│   └── scripts/        # Traffic Generator Scenarios
└── docs/               # Our product artifacts
```

## Implementation Phases

### Phase 1: Backend Foundation (FastAPI + SQLite + FAISS)
We will build the core API layer first so the frontend has real endpoints to interact with.
1. **Initialize `gateway/` project**: Set up Python virtual environment and install dependencies (`fastapi`, `uvicorn`, `sqlite3`, `sentence-transformers`, `faiss-cpu`).
2. **Database & Seeding**: Implement `db.py` to create the SQLite schema (`apps`, `requests`, `cache_entries`, `model_prices`) and populate the Seed Data on startup.
3. **Vector Cache Engine**: Implement `vector.py` to generate embeddings and handle FAISS similarity lookups.
4. **Gateway Proxy Endpoint**: Implement `POST /v1/chat/completions` mimicking the exact 10-step request lifecycle defined in the TDD.
5. **Metrics APIs**: Implement the endpoints the dashboard will poll (`/api/metrics/overview`, `/api/requests/live`, `/api/apps`).

### Phase 2: Traffic Simulation Scripts
1. **Scenario Scripts**: Build the deterministic scripts for Scenario 1 (Cache Savings), Scenario 2 (Routing), Scenario 3 (Rate Limit), and Scenario 4 (Live Data).
2. **Demo Control APIs**: Implement the `/api/demo/` endpoints (run scenario, reset, manual prompt).

### Phase 3: Frontend Foundation (Next.js)
1. **Initialize `web/` project**: Create a new Next.js project with Tailwind CSS.
2. **Design System & Components**: Build the foundational UI components based on the Figma designs (Status Badges, KPI Cards, Request Table).
3. **API Integration**: Create the polling hooks to fetch data from the FastAPI backend.

### Phase 4: Dashboard Assembly
1. **Overview Page**: Assemble the KPI cards, trend indicators, and live request stream.
2. **Manual Test Console**: Build the interactive prompt interface.
3. **Request Detail Drawer**: Build the slide-out panel that explains routing and cache decisions.
4. **Apps Management View**: Build the configuration table showing budget utilization.

### Phase 5: Deployment Preparation
1. **Dockerization**: Create a `Dockerfile` for the FastAPI backend.
2. **CORS & Environment Variables**: Configure CORS correctly so the deployed Next.js frontend can talk to the deployed FastAPI backend.
3. **GitHub Push**: Initialize git, create `.gitignore`, and push the monorepo to your GitHub account.

## Decisions Made
- **Next.js Routing:** We will use the **App Router** for the frontend.
- **Deployment Accounts:** We will defer account creation (Vercel/Render) until Phase 5.
