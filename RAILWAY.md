# Deploy PanKo to Railway

PanKo is a **monorepo** (`frontend/` + `backend/`). Railway needs **two separate services**, not one deploy from the repo root.

## 1. Push these files to GitHub

Commit the new Railway config (`Procfile`, `railway.toml`, `nixpacks.toml`, updated `requirements.txt`, etc.) and push to `main`.

## 2. Backend service (Flask API)

1. Railway → **New Project** → **Deploy from GitHub** → select your repo.
2. Add a service, or open the first service settings.
3. **Settings → Root Directory** → set to: `backend`
4. **Settings → Variables** → add:
   - `GEMINI_API_KEY` = your Google AI key
5. Deploy. Wait for a green build.
6. **Settings → Networking → Generate Domain** → copy the URL (e.g. `https://panko-api-production.up.railway.app`).

Health check: open `https://YOUR-BACKEND-URL/api/health` — should return `{"status":"ok",...}`.

## 3. Frontend service (Vite React)

1. In the **same Railway project**, click **+ New** → **GitHub Repo** → same repo again.
2. **Root Directory** → `frontend`
3. **Variables** (required **before** the first successful build — Vite embeds them at build time):

   | Variable | Example |
   |----------|---------|
   | `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `VITE_API_URL` | backend public URL from step 2 (no trailing `/`) |

4. Deploy → **Generate Domain** for the frontend.

## 4. Common failures

| Symptom | Fix |
|---------|-----|
| Build fails at repo root / “no start command” | Set **Root Directory** to `backend` or `frontend`, not empty. |
| Backend crashes on start | Ensure Root Directory is `backend` and `gunicorn` is in `requirements.txt`. |
| Frontend loads but Chef's Eye / convert fails | Set `VITE_API_URL` to the **backend** Railway URL, then **redeploy** the frontend. |
| Supabase auth errors in browser | Set `VITE_SUPABASE_*` on the frontend service and redeploy. |
| `Module not found` on backend | Root Directory must be `backend` so `requirements.txt` is found. |

## 5. Local vs production

- Local API: `http://127.0.0.1:5000` (see `frontend/src/utils/api.js`)
- Production: `VITE_API_URL` must point at your Railway backend URL.
