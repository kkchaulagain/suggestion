FROM node:lts-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
EXPOSE 3000

CMD ["sh", "-c", "npm install && npm run dev"]
