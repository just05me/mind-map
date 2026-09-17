FROM node:22-alpine AS landing-build
WORKDIR /landing
COPY landing/package.json landing/package-lock.json ./
RUN npm ci
COPY landing/ ./
RUN npm run build

FROM nginx:stable-alpine AS landing
COPY --from=landing-build /landing/dist /usr/share/nginx/html
COPY deploy/landing.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

FROM node:22-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/prisma ./server/prisma
# Prisma generate читает URL из схемы, живая БД не нужна.
ENV DATABASE_URL="postgresql://mindmap:mindmap@127.0.0.1:5432/mindmap"
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
COPY server/prisma ./server/prisma
ENV DATABASE_URL="postgresql://mindmap:mindmap@127.0.0.1:5432/mindmap"
# The npm download cache is dead weight in the final image.
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node server/dist/index.js"]
