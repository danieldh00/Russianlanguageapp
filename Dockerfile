FROM node:20-alpine

WORKDIR /app/backend
COPY backend/package*.json ./
# python3/make/g++ let native deps (better-sqlite3) compile from source when
# no prebuilt binary matches this platform (e.g. Alpine/musl on ARM, as on a
# Raspberry Pi) -- removed again afterwards to keep the final image small.
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && npm install --omit=dev \
  && apk del .build-deps
COPY backend ./
COPY frontend ../frontend

ENV PORT=3000
ENV NODE_ENV=production
VOLUME ["/app/data"]
EXPOSE 3000

CMD ["node", "src/server.js"]
