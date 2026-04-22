# ── Build Stage ──────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable
RUN npm install -g turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN turbo build --filter=@elect-ed/content-service...

# ── Production Stage ─────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/services/content-service/dist ./services/content-service/dist
COPY --from=builder --chown=appuser:nodejs /app/packages ./packages
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/services/content-service/node_modules ./services/content-service/node_modules

USER appuser

EXPOSE 8080
ENV PORT=8080
ENV GCP_PROJECT_ID=elected2026app

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "services/content-service/dist/index.js"]
