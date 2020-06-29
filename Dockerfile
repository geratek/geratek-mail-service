FROM alpine

RUN apk add --update nodejs
RUN apk add --update npm

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 80
CMD [ "node", "app.js" ]