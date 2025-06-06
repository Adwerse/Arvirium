const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// Проверка работоспособности
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'TusCoin API работает' });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'TusCoin API работает' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
}); 