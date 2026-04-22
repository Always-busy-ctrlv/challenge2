FROM node:20-slim
WORKDIR /app
RUN corepack enable
RUN npm install -g turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN turbo build --filter=@elect-ed/quiz-service...
EXPOSE 8080
ENV PORT=8080
CMD ["node", "services/quiz-service/dist/index.js"]
