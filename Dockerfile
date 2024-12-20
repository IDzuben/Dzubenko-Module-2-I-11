# Використовуємо Node.js як базовий образ
FROM node:18-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json та package-lock.json для встановлення залежностей
COPY package.json .

# Встановлюємо залежності
RUN npm install

# Копіюємо весь код проекту
COPY . .

# Відкриваємо порт 3000
EXPOSE 3000

# Запускаємо сервер
CMD ["node", "server.js"]
