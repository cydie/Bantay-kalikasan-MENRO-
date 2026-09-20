FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm install tsx typescript --save-dev

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
