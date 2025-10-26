FROM node:18-alpine AS build
WORKDIR /app
# Ensure compatibility for native binaries used by tooling (e.g., esbuild)
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci --registry=https://registry.npmmirror.com
COPY . .
RUN node -v && npm -v && npm run build --verbose

FROM node:18-alpine AS runner
WORKDIR /app
RUN npm install -g serve --registry=https://registry.npmmirror.com
COPY --from=build /app/dist /app/dist
EXPOSE 80
CMD ["serve", "-s", "/app/dist", "-l", "80"]