FROM node:20-slim

WORKDIR /app

# Copiem doar ce avem nevoie pentru deploy
COPY ./app/package*.json ./

RUN npm install

COPY ./app .

# Compilăm sau folosim tsx direct
RUN npm install -g tsx

# Comanda care rulează când containerul pornește
ENTRYPOINT ["npx", "tsx", "src/database/deploy.ts"]