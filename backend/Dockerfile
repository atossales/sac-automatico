FROM node:20-alpine AS base
WORKDIR /app

# Instala dependências do sistema necessárias para compilação nativa
RUN apk add --no-cache openssl

# ── Estágio de dependências ──────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ── Estágio de build ─────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Estágio de produção ──────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./

EXPOSE 3001

CMD ["node", "dist/app.js"]
