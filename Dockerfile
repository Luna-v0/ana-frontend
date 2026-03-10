# =============================================================================
# ANA — Frontend (Vite + Tailwind + Vanilla JS)
# Targets:
#   dev        → Vite dev server com HMR (porta 5173)
#   build      → vite build (gera dist/)
#   production → nginx servindo dist/ (porta 80)
# =============================================================================

# =============================================================================
# Base — Node + dependências
# =============================================================================
FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline


# =============================================================================
# Dev — Vite dev server com HMR
#
# No docker-compose.dev.yml:
#   develop.watch: sync src/ e public/ sem rebuild
#   Vite HMR propaga mudanças no browser automaticamente
# =============================================================================
FROM base AS dev

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]


# =============================================================================
# Build — compila assets estáticos
# =============================================================================
FROM base AS build

COPY . .
RUN npm run build


# =============================================================================
# Production — nginx servindo o build estático
# =============================================================================
FROM nginx:alpine AS production

# Copia os assets compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração nginx para SPA (hash routing — todas as rotas servem index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1
