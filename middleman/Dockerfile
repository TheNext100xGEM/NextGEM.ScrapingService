FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG NODE_ENV=prod

COPY .env.${NODE_ENV} .env

RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "start" ]