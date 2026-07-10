# --- build stage: install all deps + compile server + build widget bundles ---
# Node 22 for the widget build tooling (Vite 7 needs Node >= 20.19).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
COPY widgets/ ./widgets/
RUN npm run build   # tsc (-> dist/) + build:widgets (-> dist-widgets/)

# --- runtime stage: prod deps + compiled output only ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/dist-widgets/ ./dist-widgets/
# Cloud Run routes traffic to $PORT (default 8080) and requires the remote HTTP transport.
ENV MCP_TRANSPORT=http
EXPOSE 8080
CMD ["node", "dist/index.js"]
