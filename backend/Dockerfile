FROM node

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install 

COPY . .

# RUN pnpm prisma generate 

CMD ["pnpm", "run", "start:dev"]