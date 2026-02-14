# ETAPA 1: Build
# Folosim o imagine de Node stabilă
FROM node:20-slim as builder

# 1. Creăm directorul de lucru
WORKDIR /usr/src/app

# 2. Copiem fișierele de dependințe
COPY ./app/package*.json .

# 3. Instalăm dependințele (inclusiv puppeteer)
RUN npm install

# 4. Copiem toate fișierele în container
COPY ./app .

# 5. Rulăm comanda de build
RUN npm run build

# ETAPA 2: Producție
FROM node:20-slim

# 1. Creăm directorul de lucru
WORKDIR /usr/src/app

# 2. Copiem DOAR ce e necesar pentru rulare
COPY --from=builder /usr/src/app/package*.json ./app
COPY --from=builder /usr/src/app/dist ./app/dist

# 3. Instalăm doar dependențele de runtime (fără typescript, tsx, etc.)
RUN npm install --omit=dev

# 4. Restul codului va fi montat prin volume pentru live-coding
CMD ["sh", "-c", "node dist/index.js && tail -f /dev/null"]