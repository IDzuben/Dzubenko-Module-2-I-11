const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3000 });
const clients = new Map();

server.on('connection', (ws) => {
    console.log('Користувач приєднався');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'setName') {
            const oldName = clients.get(ws) || 'Анонім';
            clients.set(ws, data.name);
            console.log(`Користувач перейменувався: ${oldName} ➡ ${data.name}`);
            broadcastMessage(`СИСТЕМА: ${data.name} приєднався до чату`);
        } 
        else if (data.type === 'message') {
            const senderName = clients.get(ws) || 'Анонім';
            console.log(`Повідомлення від ${senderName}: ${data.text}`);
            broadcastMessage(`${senderName}: ${data.text}`);
        }
    });

    ws.on('close', () => {
        const name = clients.get(ws) || 'Анонім';
        console.log(`Користувач залишив чат: ${name}`);
        clients.delete(ws);
        broadcastMessage(`СИСТЕМА: ${name} залишив чат`);
    });

    ws.on('error', (error) => {
        console.error('Помилка WebSocket:', error.message);
    });
});

function broadcastMessage(message) {
    for (let client of clients.keys()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

console.log('Сервер чату запущено на ws://localhost:3000');
