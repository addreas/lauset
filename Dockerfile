FROM docker.io/node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

ENV NODE_ENV production

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["npm", "start"]
