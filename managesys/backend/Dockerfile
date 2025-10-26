FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev --registry=https://registry.npmmirror.com

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# Run
CMD ["node", "app.js"]