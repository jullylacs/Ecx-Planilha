# Etapa 1: build do frontend (React + Vite)
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Etapa 2: backend, servindo também o build estático do frontend
FROM node:20-alpine
WORKDIR /app/BackEnd
COPY BackEnd/package*.json ./
RUN npm ci
COPY BackEnd ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
EXPOSE 3001

# Roda as migrations pendentes e sobe o servidor
CMD ["sh", "-c", "npx sequelize db:migrate && node server.js"]
