# 🧭 Pocket Coach — Frontend

A calm, friendly chat UI for the AI Engineer Challenge, built with **Next.js 16** (App Router) + **React 19** + **Tailwind CSS v4**. It talks to the FastAPI backend in [`../api`](../api) and wraps it in a cozy little coaching companion.

> Think of it as a supportive voice in your pocket — it pings the backend, shows whether it's online, and streams your conversation into tidy chat bubbles.

---

## ✨ What's inside

- 💬 **Chat interface** — user/assistant bubbles that grow to fit their contents, auto-scroll to the newest message, and a "typing…" indicator while the model thinks.
- 🟢 **Live health badge** — calls `GET /api/health` on load and shows **Backend online / offline** so you're never guessing.
- ⌨️ **Thoughtful composer** — `Enter` to send, `Shift + Enter` for a new line, auto-growing input, and a disabled Send button when there's nothing to send.
- 🌗 **Light & dark mode** — respects your system theme with careful contrast (no white-on-white, ever).
- 🧯 **Friendly errors** — surfaces the backend's actual error message (bad key, rate limit, etc.) instead of silently failing.

---

## 🔌 How it connects to the backend

The browser always calls **relative** URLs — `/api/chat` and `/api/health` — in both dev and production:

| Endpoint | Method | Request | Response |
| --- | --- | --- | --- |
| `/api/health` | `GET` | — | `{ "status": "ok" }` |
| `/api/chat` | `POST` | `{ "message": "..." }` | `{ "reply": "..." }` |

- **In production (Vercel):** `vercel.json` routes `/api/*` to the Python function, so relative URLs just work.
- **In local dev:** `next.config.ts` rewrites `/api/*` → `http://localhost:8000/api/*`, so the same relative URLs reach your local FastAPI server.

> ℹ️ The backend takes a single `message` per request (fixed system prompt, no history), so each send transmits just your latest message. The running transcript you see is kept in the browser for display.

---

## 🏃 Run it locally

**1. Start the backend** (from the repo root — see the top-level README for setup):

```bash
uv run uvicorn api.index:app --reload
```

This serves the API on `http://localhost:8000`.

**2. Start this frontend** (from the `frontend/` folder):

```bash
npm install   # first time only
npm run dev
```

Open **http://localhost:3000** and start chatting. 🎉

> Backend running somewhere other than `localhost:8000`? Point the dev proxy at it:
> ```bash
> BACKEND_ORIGIN="http://localhost:9000" npm run dev
> ```

---

## 🧰 Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (hot reload) on port 3000 |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## 🚀 Deploying to Vercel

This app deploys together with the backend from the **repository root** (see the top-level README's deployment section). The root `vercel.json` already wires up both the Next.js app and the FastAPI function — so from the repo root:

```bash
npx vercel --prod
```

Remember to add your provider environment variables (`LLM_PROVIDER`, `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`, and the model) in the Vercel dashboard. 🔑
