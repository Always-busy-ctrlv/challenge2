FROM node:20-slim
WORKDIR /app
RUN corepack enable
RUN npm install -g turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN turbo build --filter=@elect-ed/content-service...
EXPOSE 8080
ENV PORT=8080
CMD ["node", "services/content-service/dist/index.js"]
