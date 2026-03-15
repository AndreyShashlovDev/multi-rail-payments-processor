FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY libs ./libs
COPY apps/external-integration ./apps/external-integration

RUN npm run proto:generate

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY libs ./libs
COPY apps/external-integration ./apps/external-integration

RUN npm run proto:generate
RUN npm run build external-integration

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/libs ./libs

EXPOSE 3002

CMD ["node", "dist/apps/external-integration/main.js"]

