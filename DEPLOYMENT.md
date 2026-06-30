# Deploying Truevindo Games (free hosting)

The app runs as **one Node service** that serves the React frontend, the REST API,
and the Socket.IO realtime layer together. Because it needs a long-running server
with **WebSocket** support, use a host that keeps a Node process alive (Render,
Railway, Fly.io) — **not** a static/serverless-only host like plain Vercel.

Database stays on **Supabase** (already configured) — no change needed there.

Required environment variables on the host:

| Variable       | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| `NODE_ENV`     | `production`                                                          |
| `DATABASE_URL` | Your Supabase **pooler** URL (same as local `.env`)                   |
| `APP_URL`      | The public URL the host gives you, e.g. `https://truevindo-games.onrender.com` |
| `PORT`         | Usually injected by the host automatically — leave unset              |

---

## Option A — Render.com (recommended, free, GUI)

Render's free Web Service supports WebSocket and reads the included `render.yaml`.

1. **Put the code on GitHub**
   ```bash
   git init
   git add .
   git commit -m "Truevindo Games"
   git branch -M main
   git remote add origin https://github.com/<you>/truevindo-games.git
   git push -u origin main
   ```
   (`.env` is git-ignored, so your DB password is NOT pushed.)

2. Go to <https://render.com> → **New +** → **Blueprint** → connect the repo.
   Render detects `render.yaml` and creates the service.

3. When prompted, fill the env vars marked "manual":
   - `DATABASE_URL` → paste the same value from your local `.env`
   - `APP_URL` → leave blank for now, set it after step 4 to the assigned URL
     (e.g. `https://truevindo-games.onrender.com`), then redeploy.

4. Click **Apply / Deploy**. First build takes a few minutes. You'll get a public
   URL like `https://truevindo-games.onrender.com` — share that with your team.

> Free tier note: the service sleeps after ~15 min of inactivity; the first request
> after that takes ~50s to wake. Fine for testing. Keep the tab active during a live quiz.

---

## Option B — Railway (free trial credit, CLI, no GitHub needed)

```bash
npm i -g @railway/cli
railway login
railway init
railway up                 # deploys this folder (uses the Dockerfile)
railway variables set NODE_ENV=production DATABASE_URL="<your-supabase-url>" APP_URL="<railway-url>"
railway domain             # generates a public URL
```

---

## Option C — Fly.io (free allowance, CLI + Docker)

```bash
# install flyctl from https://fly.io/docs/hands-on/install-flyctl/
fly launch --no-deploy            # detects the Dockerfile; pick a name/region
fly secrets set DATABASE_URL="<your-supabase-url>" APP_URL="https://<app>.fly.dev" NODE_ENV=production
fly deploy
```

---

## Verify after deploy

- `https://<your-url>/api/health` → `{"success":true,...}`
- Open `https://<your-url>/` → the Join screen loads
- Admin: `https://<your-url>/admin/login`
- Host a session, then join from a phone using the PIN — confirm realtime sync works.

## Local production preview (optional)

```bash
npm run prisma:generate
npx vite build
# bash:
NODE_ENV=production PORT=4100 npm start
# PowerShell:
$env:NODE_ENV="production"; $env:PORT="4100"; npm start
```
Then open <http://localhost:4100>.
