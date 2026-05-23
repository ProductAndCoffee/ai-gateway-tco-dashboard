# Deployment Guide

The AI Gateway Simulator is designed to be deployed as two separate services:
1. **Frontend (Dashboard):** Hosted on Vercel or Azure Static Web Apps.
2. **Backend (Gateway):** Hosted on a container platform like Azure Container Apps, Render, or Fly.io.

---

## Option A: Deploying on Render & Vercel (Fast PaaS Setup)

### 1. Deploy the Backend (Gateway) on Render
The backend uses SQLite and a local FAISS vector index, so it must be deployed as a container or VM, not a serverless function.

**Steps:**
1. Create a Render account and select **New Web Service**.
2. Connect this GitHub repository.
3. Scroll down and set the **Root Directory** to `gateway`.
4. Render will automatically detect the `Dockerfile` inside the `gateway` folder.
5. Click **Deploy**.
6. Once deployed, copy the Render URL (e.g., `https://ai-gateway-backend.onrender.com`).

*Note: Render's free tier spins down after inactivity. For an interview demo, ensure you ping the backend right before you share your screen to wake it up.*

### 2. Deploy the Frontend (Dashboard) on Vercel
The Next.js frontend is fully optimized for Vercel.

**Steps:**
1. Create a Vercel account and select **Add New Project**.
2. Connect this GitHub repository.
3. In the "Configure Project" screen, look for **Root Directory**. Click **Edit** and select the `web` folder.
4. Open the **Environment Variables** section.
5. Add the following variable:
   * **Key:** `NEXT_PUBLIC_API_URL`
   * **Value:** `<YOUR_BACKEND_RENDER_URL>` (e.g., `https://ai-gateway-backend.onrender.com` - *do not include a trailing slash*).
6. Click **Deploy**.

---

## Option B: Deploying on Microsoft Azure (Actual Implementation)

This is the verified deployment architecture used for the live system. It leverages **Azure Container Apps (ACA)** for the backend gateway and **Azure Static Web Apps (SWA)** for the Next.js frontend.

### 1. Deploy the Backend on Azure Container Apps (ACA)

#### A. Configure Registry & Environment
Create your resource group and container app environment in the Azure Portal or using the Azure CLI:
```bash
# Register Container Registry provider if needed
az provider register --namespace Microsoft.ContainerRegistry

# Create the Container App Environment
az containerapp env create \
  --name ai-gateway-backend-env \
  --resource-group ai-gateway-rg \
  --location eastus
```

#### B. Setup Continuous Deployment (GitHub Actions)
Since direct container builds might be restricted by subscription policies (ACR Tasks restrictions), configure GitHub Actions to build the container:
1. In the Azure Portal, create a new **Container App** inside your environment (`ai-gateway-backend-env`).
2. Choose **GitHub Actions** as the deployment source.
3. Select your repository and branch.
4. Set the **Context path** to `./gateway` (where the `Dockerfile` resides).
5. Set the **Target Port** to `8000` (FastAPI container port).
6. Save. Azure will automatically generate and commit a GitHub Actions workflow in your repository (e.g., `.github/workflows/ai-gateway-tco-dashboard-AutoDeployTrigger-*.yml`) which builds and deploys the container.

> [!IMPORTANT]
> **Docker Base Image Gotcha (SQLite Dependency):**
> The backend runs a local SQLite database (`gateway.db`). The standard `python:3.11-slim` base image lacks system-level SQLite libraries. Your `gateway/Dockerfile` must explicitly install these system libraries before running `pip install`:
> ```dockerfile
> RUN apt-get update && apt-get install -y --no-install-recommends \
>     sqlite3 \
>     libsqlite3-dev \
>     && rm -rf /var/lib/apt/lists/*
> ```

---

### 2. Deploy the Frontend on Azure Static Web Apps (SWA)
Azure Static Web Apps provides global CDN edge hosting and built-in Next.js optimization.

#### A. Create the Static Web App
1. Go to the **Azure Portal**, search for **Static Web Apps**, and click **Create**.
2. Set the plan to **Free** (F1).
3. Connect your **GitHub** account and choose your repository/branch.
4. In the build configurations:
   * **Build Presets:** Next.js
   * **App location:** `/web`
   * **Api location:** (Leave blank)
   * **Output location:** (Leave blank - SWA will auto-detect Next.js build directories).
5. Click **Review + Create** and **Create**.

#### B. Configure Build-Time Environment Variables (Crucial)
Next.js client-side variables (starting with `NEXT_PUBLIC_`) are compiled and baked into static bundles at **build time**. Since SWA builds the application on GitHub Actions runners, setting configuration in the Azure portal is not enough.

1. Open your repository on GitHub.
2. Navigate to the automatically generated workflow file (e.g., `.github/workflows/azure-static-web-apps-*.yml`).
3. Edit the workflow file and add an `env:` block under the **`Build And Deploy`** task step (ensure correct vertical alignment with 8 spaces):
   ```yaml
         - name: Build And Deploy
           id: builddeploy
           uses: Azure/static-web-apps-deploy@v1
           with:
             azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_LEMON_GLACIER_09928AE0F }}
             repo_token: ${{ secrets.GITHUB_TOKEN }}
             action: "upload"
             app_location: "./web"
             api_location: ""
             output_location: ""
           env:
             NEXT_PUBLIC_API_URL: "https://<your-backend-container-app-url>"
   ```
4. Commit the change to the `main` branch. This triggers a re-run of the build runner, baking the correct Azure backend URL into the production JavaScript bundles.

---

## 3. Verify the Deployment

1. Open your Vercel or Azure Static Web App URL in your browser.
2. Go to the **Demo Controls / Operator Settings** panel in the dashboard UI and click **Reset Demo**. This seeds the remote backend SQLite DB with client apps and default metrics.
3. Go to the **Manual Console** in the dashboard and type a custom prompt.
4. Click **Send** and confirm that the request immediately appears in the **Live Request Stream** and updates the metric counters.
