# ── Build Stage ──────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable
RUN npm install -g turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN turbo build --filter=@elect-ed/web...

# ── Production Stage ─────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
