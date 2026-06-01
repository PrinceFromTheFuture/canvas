# Next.js web app. Build from the repo root:
#   docker build -f apps/web/Dockerfile -t arb-web .
FROM node:20-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- deps: install the whole workspace (packages ship TS source) ---
FROM base AS deps
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm install

# --- build: compile the Next app ---
FROM deps AS build
# Placeholder so any module evaluated during build does not require real infra.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV REDIS_URL=redis://localhost:6379
ENV NODE_ENV=production
RUN npm run build --workspace @arb/web

# --- run ---
FROM build AS runner
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@arb/web"]
