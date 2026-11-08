FROM node:26-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:26-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:26-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts ./scripts
RUN chown -R 1001:1001 /app
USER 1001:1001
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
