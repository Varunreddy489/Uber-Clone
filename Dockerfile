FROM node:20-alpine

ARG DATABASE_URL

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

COPY . .
RUN pnpm install
RUN DATABASE_URL=$DATABASE_URL npx prisma generate
RUN DATABASE_URL=$DATABASE_URL pnpm run build

EXPOSE 5000

CMD ["pnpm", "start"]