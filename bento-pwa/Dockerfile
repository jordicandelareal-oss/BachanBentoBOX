FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Railway usa la variable PORT automáticamente
EXPOSE 8080

CMD ["node", "robot-server.js"]
