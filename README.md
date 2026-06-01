# AI Report Builder

A minimal, canvas-style tool: **upload data → an AI authors a report in a constrained JSX vocabulary → share it by link → export to PDF.** One source renders to both an interactive web view and a static PDF. The AI is a *secondary actor*: it maps your data into a shared language, it does not invent arbitrary UI.

## Why this shape

- **Shared language, divergent data.** The AI may only use a fixed component vocabulary (`Stack`, `Card`, `Stat`, `Table`, `Sections`, `BarChart`, …). Security comes from a *curated scope*, not a sandbox: a static guardrail rejects HTML tags, imports, and unknown identifiers before any code runs.
- **One source, two renderers.** Each vocabulary component has a **web branch** (DOM) and a **PDF branch** (`@react-pdf/renderer`), selected by the scope injected at render time. Interactive web behavior (e.g. `Sections` shows one panel at a time) collapses to a **static projection** in PDF (all panels revealed). Chart geometry is computed once and shared.
- **JSX is the source of truth.** A JSON projection is *derived* (easy to downgrade to, hard to upgrade from).
- **Durable streaming.** Generation runs in a dedicated worker; chunks flow through a per-run **Redis Stream**; the client owns the transport (tRPC SSE) and reuses the AI SDK's `readUIMessageStream` materialization. Resume = cursor replay. Cancel = a cross-process Redis flag. The run lock is a Postgres **partial unique index**.

## Monorepo layout

```
apps/
  web/      Next.js App Router: dashboard, builder (chat + live preview), /r/:slug viewer, tRPC + PDF routes
  worker/   Long-lived producer: consumes run jobs, executes runReportTurn, heartbeats, watchdog
packages/
  report-language/  The vocabulary (web + pdf branches), tokens, charts, and the eval pipeline (guardrail/transform/runner/json)
  ai/               Provider, system prompt, dataset tools, run lifecycle + runReportTurn
  streaming/        Redis client, per-run streams, job queue, cancel flags
  db/               Drizzle schema (users, datasets, reports, report_runs) + client
  data/             CSV/JSON/Excel parsing, profiling, blob storage
  trpc/             Context, routers (report/dataset/run), SSE subscription
```

## Setup

```bash
cp .env.example .env   # set DATABASE_URL, REDIS_URL, OPENAI_API_KEY (or ANTHROPIC), APP_URL, AUTH_SECRET
npm install
npm run db:generate && npm run db:migrate
npm run dev:web        # Next.js on :3000
npm run dev:worker     # producer (separate terminal)
```

You need a Postgres and a Redis instance running (local Docker is fine).

## Deployment

- **web** → Vercel (Next.js). Set env vars; `serverComponentsExternalPackages` keeps esbuild / @react-pdf / ioredis / postgres server-side.
- **worker** → any always-on host (Fly.io / Render / a small VM). See `apps/worker/Dockerfile`. It is the producer; Vercel functions only enqueue + subscribe.
- **Redis** → Upstash / managed Redis (Streams supported).
- **Postgres** → Neon / Supabase / managed PG.

## Security model (summary)

| Concern | Mitigation |
| --- | --- |
| Arbitrary code from the model | Static **guardrail** (no imports, no intrinsics, no unknown globals) + curated eval scope; `require`/`fetch` stubbed |
| Resource abuse | Source length cap, upload size cap, bounded tool outputs, run lock prevents duplicate producers |
| Share links | 21-char `nanoid` slug, `unlisted` visibility required to resolve publicly |
| Auth | Creator routes require a signed session cookie; the viewer is intentionally anonymous |
| Secrets/data | Datasets stored as parsed rows in pluggable blob storage; never shipped to the model in bulk (tools compute figures) |
```
# canvas
