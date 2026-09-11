FROM node:20-alpine

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend ./
COPY frontend ../frontend

ENV PORT=3000
ENV NODE_ENV=production
VOLUME ["/app/data"]
EXPOSE 3000

CMD ["node", "src/server.js"]
