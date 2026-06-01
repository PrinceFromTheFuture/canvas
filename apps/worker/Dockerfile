# Producer worker. Build from the repo root:
#   docker build -f apps/worker/Dockerfile -t arb-worker .
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# Install workspace deps (worker pulls @arb/* source via tsx; no build step).
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN npm install --omit=dev --workspaces --include-workspace-root=false || npm install

CMD ["npm", "run", "start", "--workspace", "@arb/worker"]
