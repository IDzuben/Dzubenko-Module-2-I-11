const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Карта для зберігання клієнтів
const clients = new Map();

// HTTP-сервер
const httpServer = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Помилка сервера');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.method === 'GET' && req.url.startsWith('/disconnect')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const username = urlParams.get('username') || 'Анонім';

        let userSocket = null;
        for (let [socket, name] of clients.entries()) {
            if (name === username) {
                userSocket = socket;
                break;
            }
        }

        if (userSocket) {
            userSocket.close();
            clients.delete(userSocket);
            broadcastActiveUsers();
            broadcastMessage(`СИСТЕМА: ${username} залишив чат`);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`${username} відключився`);
            return;
        }

        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Користувача не знайдено');
    } else if (req.method === 'GET' && req.url.startsWith('/ban')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const username = urlParams.get('username');

        let userSocket = null;
        for (let [socket, name] of clients.entries()) {
            if (name === username) {
                userSocket = socket;
                break;
            }
        }

        if (userSocket) {
            userSocket.close();
            clients.delete(userSocket);
            broadcastActiveUsers();
            broadcastMessage(`СИСТЕМА: ${username} був заблокований`);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`${username} заблокований`);
            return;
        }

        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Користувача не знайдено');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Маршрут не знайдено');
    }
});

// WebSocket сервер
const wsServer = new WebSocket.Server({ noServer: true });

wsServer.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'setName') {
                clients.set(ws, data.name);
                broadcastMessage(`СИСТЕМА: ${data.name} приєднався до чату`);
                broadcastActiveUsers();
            } else if (data.type === 'message') {
                const senderName = clients.get(ws) || 'Анонім';
                broadcastMessage(`${senderName}: ${data.text}`);
            }
        } catch (error) {
            console.error('Помилка обробки повідомлення:', error.message);
        }
    });

    ws.on('close', () => {
        const name = clients.get(ws) || 'Анонім';
        clients.delete(ws);
        broadcastMessage(`СИСТЕМА: ${name} залишив чат`);
        broadcastActiveUsers();
    });

    ws.on('error', (error) => {
        console.error('Помилка WebSocket:', error.message);
    });
});

// Функція для розсилки повідомлень всім підключеним користувачам
function broadcastMessage(message) {
    for (let client of clients.keys()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', text: message }));
        }
    }
}

// Функція для оновлення списку активних користувачів
function broadcastActiveUsers() {
    const activeUsers = Array.from(clients.values());
    for (let client of clients.keys()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'activeUsers', users: activeUsers }));
        }
    }
}

// Інтеграція WebSocket з HTTP-сервером
httpServer.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
    });
});

httpServer.listen(3000, () => {
    console.log('Сервер запущено на порту 3000');
});
