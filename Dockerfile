FROM node:18

# Installa FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

# Copia i file di dipendenza
COPY package*.json ./
RUN npm install

# Copia il resto dell'applicazione
COPY . .

# Compila il codice TypeScript
RUN npm run build

# Esponi la porta che verrà utilizzata da Railway
EXPOSE 8080

# Comando per avviare l'applicazione
CMD ["npm", "start"]
