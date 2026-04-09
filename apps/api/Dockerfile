FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --no-frozen-lockfile
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @securelend/shared build
RUN cd apps/api && npx prisma generate
RUN pnpm --filter @securelend/api build

FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate
RUN apk add --no-cache postgresql-client
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared ./packages/shared
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "echo '=== CLEANUP START ===' && psql \"$DATABASE_URL\" -c \"DELETE FROM _prisma_migrations WHERE migration_name IN ('20260409100000_update_suggestion_statuses','20260409110000_add_suggestion_image');\" 2>&1 && echo '=== CLEANUP DONE ===' ; echo '=== MIGRATE START ===' && npx prisma migrate deploy 2>&1 ; echo '=== MIGRATE DONE ===' && node dist/main.js"]
