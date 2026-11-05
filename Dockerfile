# Imagen de la DEMO PÚBLICA de Finanzas (datos ficticios que se regeneran cada noche).
# Nada de aquí lee ni copia la base real: .dockerignore excluye apps/data, *.db y .env.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Dependencias: solo los manifiestos, para que Docker cachee esta capa
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
# El postinstall de la raíz necesita este script y el ejemplo de .env
COPY apps/api/scripts apps/api/scripts
COPY apps/api/.env.example apps/api/.env.example
RUN pnpm install --frozen-lockfile

# Código fuente + cliente de Prisma
FROM deps AS build
COPY . .
RUN pnpm --filter api exec prisma generate

# Web compilada (con el aviso de demo activado)
FROM build AS webbuild
ARG VITE_DEMO_BANNER=1
ENV VITE_DEMO_BANNER=$VITE_DEMO_BANNER
RUN pnpm --filter web build

# API: siembra datos ficticios al arrancar y se reinicia cada noche (ver apps/api/scripts/demo-run.mjs)
FROM build AS api
ENV NODE_ENV=production
ENV TZ=America/Bogota
ENV PORT=3001
ENV DATABASE_URL=file:/tmp/demo.db
USER node
CMD ["node", "apps/api/scripts/demo-run.mjs"]

# Web: nginx sirve los estáticos y hace de proxy de /api hacia la API (misma red del contenedor)
FROM nginx:1.27-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=webbuild /app/apps/web/dist /usr/share/nginx/html
