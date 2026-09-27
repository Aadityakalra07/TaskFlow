FROM node:24
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
EXPOSE 3000
CMD ["node", "src/server.js"]