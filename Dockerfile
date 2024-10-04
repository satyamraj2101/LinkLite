
FROM node:18-alpine


WORKDIR /app


COPY package*.json ./


RUN npm install --production


COPY . .


EXPOSE 3000


ENV NODE_ENV=production


CMD ["node", "server.js"]
