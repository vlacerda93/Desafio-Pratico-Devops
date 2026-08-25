FROM node:18-alpine

# Instala openssl e compatibilidade com glibc para o Prisma funcionar no Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build --if-present

EXPOSE 3000

CMD ["npm", "start"]