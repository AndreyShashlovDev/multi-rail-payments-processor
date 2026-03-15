FROM node:20-alpine AS development

WORKDIR /app

COPY package.json yarn.lock ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN yarn install --frozen-lockfile

COPY libs ./libs
COPY apps/api-gateway ./apps/api-gateway

RUN yarn proto:generate || echo "Proto generation skipped"

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN yarn install --frozen-lockfile

COPY libs ./libs
COPY apps/api-gateway ./apps/api-gateway

RUN yarn proto:generate || echo "Proto generation skipped"
RUN yarn build api-gateway

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile && yarn cache clean

COPY --from=build /app/dist ./dist
COPY --from=build /app/libs ./libs

EXPOSE 3000

CMD ["node", "dist/apps/api-gateway/main.js"]
