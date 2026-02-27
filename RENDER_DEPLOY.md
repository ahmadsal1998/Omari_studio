# Deploy Backend to Render

This guide connects the GitHub repo to Render and deploys **only the backend** as a Web Service.

## Option A: Deploy with Blueprint (recommended)

1. **Open Render Blueprint**
   - Go to **[dashboard.render.com/select-repo?type=blueprint](https://dashboard.render.com/select-repo?type=blueprint)**.
   - Or: **New** → **Blueprint** → connect **ahmadsal1998/Omari_studio**.

2. **Confirm settings**
   - Render will read `render.yaml` and create a web service named **omari-studio-api** with:
     - **Root Directory:** `backend`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
   - Click **Apply** / **Create resources**.

3. **Set required environment variables**
   - Open the new service → **Environment** tab.
   - Add (or complete the ones marked "Sync" in the Blueprint):

   | Key | Value | Required |
   |-----|--------|----------|
   | `MONGODB_URI` | Your MongoDB connection string (e.g. from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) | Yes |
   | `JWT_SECRET` | A long random string for signing JWTs (e.g. `openssl rand -base64 32`) | Yes |
   | `PORT` | Leave unset — Render sets this automatically for web services | No |

   Optional:

   | Key | Value |
   |-----|--------|
   | `JWT_EXPIRES_IN` | e.g. `7d` (default) |
   | `NODE_ENV` | Set by Blueprint to `production` |
   | `FIREBASE_STORAGE_BUCKET` | If you use Firebase uploads |
   | `FIREBASE_SERVICE_ACCOUNT` | JSON string of service account (if not using a file) |

4. **Deploy**
   - Save env vars and trigger a **Manual Deploy** (or wait for auto-deploy from the first Blueprint apply).
   - Wait until the build and deploy succeed.

5. **Backend URL**
   - In the service dashboard, open **Settings** or the service URL.
   - Your backend will be at: **`https://omari-studio-api.onrender.com`** (or the name you gave the service).
   - API base for the frontend: **`https://omari-studio-api.onrender.com/api`**  
     (Use this as `VITE_API_URL` in Vercel for the frontend.)

---

## Option B: Create Web Service manually (no Blueprint)

1. Go to **[dashboard.render.com](https://dashboard.render.com)** → **New** → **Web Service**.
2. Connect **ahmadsal1998/Omari_studio** (GitHub).
3. Configure:
   - **Name:** `omari-studio-api` (or any name).
   - **Region:** your choice.
   - **Branch:** `main`.
   - **Root Directory:** `backend`
   - **Runtime:** Node.
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. **Environment** → add `MONGODB_URI` and `JWT_SECRET` as in the table above.
5. Click **Create Web Service**.

---

## Connect frontend to the backend

After the backend is live:

1. Copy the Render URL, e.g. `https://omari-studio-api.onrender.com`.
2. In **Vercel** (frontend project) → **Settings** → **Environment Variables**:
   - Add: `VITE_API_URL` = `https://omari-studio-api.onrender.com/api`
3. Redeploy the frontend so it uses the new API URL.

---

## Notes

- **MongoDB:** Use a cloud DB (e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) and put the connection string in `MONGODB_URI`. Allow access from anywhere (0.0.0.0/0) or add [Render’s outbound IPs](https://render.com/docs/outbound-ip-addresses) in Atlas.
- **Free tier:** Render free tier spins down after inactivity; the first request may be slow (cold start).
- **Health check:** The backend exposes `GET /health`. The Blueprint sets **Health Check Path** to `/health` for zero-downtime deploys.

- **Build:** The backend must run `npm run build` (TypeScript → `dist/`). The Blueprint uses **Build Command** `npm install && npm run build`. If your deploy only ran `npm install`, set Build Command to `npm install && npm run build` in the service **Settings**. A `postinstall` script also runs the build on Render when `RENDER=true`, so a redeploy after pulling the latest code may fix the issue.
