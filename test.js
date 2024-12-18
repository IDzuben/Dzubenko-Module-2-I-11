const WebSocket = require('ws');

function testServerConnection() {
    const ws1 = new WebSocket('ws://localhost:3000');
    const ws2 = new WebSocket('ws://localhost:3000');

    let step = 0;

    ws1.on('open', () => {
        console.log('✅ Тест: Перший клієнт підключився');
        ws1.send(JSON.stringify({ type: 'setName', name: 'Петро' }));
    });

    ws2.on('open', () => {
        console.log('✅ Тест: Другий клієнт підключився');
        ws2.send(JSON.stringify({ type: 'setName', name: 'Марія' }));
    });

    ws1.on('message', (data) => {
        console.log('WS1 отримав:', data);

        if (step === 0) {
            ws1.send(JSON.stringify({ type: 'message', text: 'Привіт!' }));
            step++;
        } else if (step === 1) {
            ws1.close();
            ws2.close();
        }
    });

    ws2.on('message', (data) => {
        console.log('WS2 отримав:', data);
    });

    ws1.on('close', () => console.log('✅ Тест: Перший клієнт відключився'));
    ws2.on('close', () => console.log('✅ Тест: Другий клієнт відключився'));
}

testServerConnection();
