# 使用 Node.js 官方轻量级镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml (如果有)
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制所有源代码
COPY . .

# 构建应用 (前端 + 后端)
RUN pnpm run build

# 暴露端口 (默认 3000)
EXPOSE 3000

# 设置环境变量 (生产模式)
ENV NODE_ENV=production
ENV PORT=3000

# 启动命令
CMD ["npm", "start"]
