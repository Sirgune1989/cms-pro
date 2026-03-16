FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

RUN mkdir -p /app/uploads /app/data

EXPOSE 4000

CMD ["node", "src/server.js"]
