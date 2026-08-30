# Scholr

Scholr is a modern, all-in-one student workspace: rich-text notes, an AI study
assistant, course/subject organization, checklists, tables, equations, code
blocks, quotes, dividers, image uploads, and a customizable UI — all in one
fast, single-page app.

## Features

- 📝 Rich-text notes (checklists, tables, equations, code blocks, quotes, dividers, images)
- 🤖 AI study assistant (streaming responses, LaTeX/math rendering)
- 📚 Courses/subjects organization
- 🎨 Customizable themes/UI

## Architecture

- **Frontend** — `index.html`, a single-page app hosted on **GitHub Pages**.
  No build step required.
- **Backend** — `server.js`, a small **Node.js + Express** API hosted on
  **Render**. Its only job is to safely forward chat messages to Google
  Gemini and stream the reply back — it never exposes the API key to the browser.
- **AI** — **Google Gemini** (`gemini-3.6-flash` by default), called only from
  the backend, streamed to the frontend over Server-Sent Events (SSE) so
  responses appear progressively instead of all at once.

```
Browser (index.html) --fetch()--> Render backend (server.js) --> Gemini API
        ^                                  |
        └──────────── SSE stream ──────────┘
```

## Development setup

**Frontend**
```bash
git clone https://github.com/bshui596/scholr-test.git
cd scholr-test
# open index.html directly, or serve it with any static server, e.g.:
npx serve .
```

**Backend**
```bash
npm install
cp .env.example .env   # then fill in your real GEMINI_API_KEY
npm start               # runs on http://localhost:3001
```

## AI backend

All AI features run through small, focused endpoints on the Express backend
(`server.js`) — the browser never talks to Gemini directly.

| Endpoint               | Body                      | Returns                                   | Purpose                          |
|-------------------------|---------------------------|--------------------------------------------|-----------------------------------|
| `POST /api/chat`        | `{ message, history }`   | SSE stream (`data: {"text":"..."}`, then `{"done":true}`) | Streaming study assistant chat |
| `POST /api/notes`       | `{ text }`                | `{ notes }`                                | Turn raw text/lecture notes into organized study notes |
| `POST /api/essay`       | `{ topic, wordCount?, tone? }` | `{ essay }`                            | Draft an essay from a topic (drafting aid, not a final submission) |
| `POST /api/outline`     | `{ topic }`               | `{ outline }`                              | Essay/report outline generator   |
| `POST /api/summarize`   | `{ text }`                | `{ summary }`                              | Bullet-point summary of a note   |
| `POST /api/flashcards`  | `{ text, count? }`        | `{ flashcards: [{question, answer}] }`     | Auto-generate flashcards         |
| `POST /api/quiz`        | `{ text, count? }`        | `{ questions: [{question, options, answerIndex}] }` | Auto-generate an interactive practice quiz |
| `POST /api/explain`     | `{ text, level? }`        | `{ explanation }`                          | Explain a concept ("simple" or "detailed") |
| `POST /api/rewrite`     | `{ text, tone? }`         | `{ rewritten }`                            | Paraphrase / change tone (formal, casual, concise, simpler) |
| `POST /api/polish`      | `{ text }`                | `{ improved }`                             | Grammar/clarity pass on a note   |
| `POST /api/studyplan`   | `{ text, days? }`         | `{ plan }`                                 | Day-by-day study schedule from material |

- Only `/api/chat` streams; the rest are fast one-shot JSON calls (capped
  `maxOutputTokens` per task keeps them quick and on-topic).
- Math in responses is written in LaTeX (`$...$` inline, `$$...$$` block) and
  rendered client-side with MathJax.
- All AI output is inserted into the page with `textContent`, never
  `innerHTML`, so responses can never inject HTML/JavaScript.
- `frontend-ai-chat-snippet.js` is a self-contained AI Tools panel: a tabbed
  floating widget (Chat, Notes, Essay, Outline, Summarize, Flashcards, Quiz,
  Explain, Rewrite, Polish, Study Plan) with animated transitions, interactive
  flip-flashcards, and a clickable quiz UI — it injects its own CSS/HTML, so
  no manual markup copying is required.
- `bonus-features-snippet.js` adds a **Bonus Codes** section (auto-attaches
  into your Settings panel, or floats bottom-left if no settings container is
  found) plus reusable animation helpers (ripple buttons, card lift, shimmer
  skeletons, staggered fade-ins, confetti). Built-in codes: `SCHOLRADMIN`
  (hidden Admin Panel — view/export/clear local data, toggle debug mode),
  `CONFETTI`, `RAINBOW`, `NIGHTOWL`. Change the codes/effects in
  `BONUS_CODES` to whatever you like. Everything is local-only (localStorage
  feature flags) — no server involved, nothing to secure.

### Environment variables (set these in Render, never commit them)

| Variable         | Description                                      |
|------------------|---------------------------------------------------|
| `GEMINI_API_KEY` | Your Google Gemini API key                        |
| `GEMINI_MODEL`   | Model name, e.g. `gemini-3.6-flash`                |
| `ALLOWED_ORIGIN` | Comma-separated list of origins allowed to call the API (e.g. your GitHub Pages URL) |
| `PORT`           | Port the server listens on (Render sets this automatically) |

**`.env` and API keys must never be committed to GitHub.** `.gitignore`
already excludes `.env` and `node_modules/`.

## Deployment

- **Frontend:** push to `main` → GitHub Pages serves `index.html` automatically.
- **Backend:** push to `main` → Render redeploys `server.js` automatically,
  using the environment variables configured in the Render dashboard.

## Contributing

Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.
