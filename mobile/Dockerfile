# Build from the repository root: docker build -f mobile/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /app/mobile
COPY mobile/package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY shared /app/shared
COPY scripts/build.mjs /app/scripts/build.mjs
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production PORT=8080
WORKDIR /app/mobile
COPY --from=build --chown=node:node /app/mobile/dist ./dist
COPY --from=build --chown=node:node /app/shared/server.mjs /app/shared/server.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "../shared/server.mjs", "mobile"]
