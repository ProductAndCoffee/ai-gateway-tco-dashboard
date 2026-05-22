# Deployment Guide

The AI Gateway Simulator is designed to be deployed as two separate services:
1. **Frontend (Dashboard):** Hosted on Vercel (Serverless Next.js).
2. **Backend (Gateway):** Hosted on a container platform like Render, Fly.io, or AWS AppRunner.

## 1. Deploy the Backend (Gateway)

The backend uses SQLite and a local FAISS vector index, so it must be deployed as a container or VM, not a serverless function.

**Using Render (Recommended):**
1. Create a Render account and select **New Web Service**.
2. Connect this GitHub repository.
3. Scroll down and set the **Root Directory** to `gateway`.
4. Render will automatically detect the `Dockerfile` inside the `gateway` folder.
5. Click **Deploy**.
6. Once deployed, copy the Render URL (e.g., `https://ai-gateway-backend.onrender.com`).

*Note: Render's free tier spins down after inactivity. For an interview demo, ensure you ping the backend right before you share your screen to wake it up.*

## 2. Deploy the Frontend (Vercel)

The Next.js frontend is fully optimized for Vercel.

**Steps:**
1. Create a Vercel account and select **Add New Project**.
2. Connect this GitHub repository.
3. In the "Configure Project" screen, look for **Root Directory**. Click **Edit** and select the `web` folder.
4. Open the **Environment Variables** section.
5. Add the following variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `<YOUR_BACKEND_RENDER_URL>` (e.g., `https://ai-gateway-backend.onrender.com`)
   *(Make sure there is no trailing slash).*
6. Click **Deploy**.

## 3. Verify the Deployment

1. Open your Vercel URL.
2. Click **Reset Demo** in the Settings panel. This will initialize the seeded apps on the remote backend SQLite DB.
3. Type a prompt in the Manual Console and hit send. You should see it appear in the live stream.
4. You are now ready for your interview!
