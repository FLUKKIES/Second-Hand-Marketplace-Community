FROM node

WORKDIR /app

# 1. ติดตั้ง pnpm
RUN npm install -g pnpm

# 2. Copy ไฟล์ config
COPY package.json pnpm-lock.yaml ./

# 3. Install dependencies
RUN pnpm install --frozen-lockfile

# 4. Copy code
COPY . .

# 5. Generate Prisma (ถ้ามี Prisma)
# RUN pnpm prisma generate 

EXPOSE 3001

CMD ["pnpm", "run", "start:dev"]