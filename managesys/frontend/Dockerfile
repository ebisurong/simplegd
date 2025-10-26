FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --registry=https://registry.npmmirror.com
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
RUN npm install -g serve --registry=https://registry.npmmirror.com
COPY --from=build /app/dist /app/dist
EXPOSE 80
CMD ["serve", "-s", "/app/dist", "-l", "80"]