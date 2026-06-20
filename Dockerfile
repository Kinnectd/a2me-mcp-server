# --- build stage: install all deps + compile TypeScript ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --- runtime stage: prod deps + compiled output only ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist/ ./dist/
# Cloud Run routes traffic to $PORT (default 8080) and requires the remote HTTP transport.
ENV MCP_TRANSPORT=http
EXPOSE 8080
CMD ["node", "dist/index.js"]
