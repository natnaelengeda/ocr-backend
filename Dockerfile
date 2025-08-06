FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 7454

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]