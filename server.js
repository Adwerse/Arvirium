const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Подключение к Cosmos DB
const connectDB = async () => {
    try {
        const uri = process.env.COSMOS_DB_URI;
        if (!uri) {
            throw new Error('COSMOS_DB_URI не определен в переменных окружения');
        }
        
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: 'majority'
        });
        console.log('Успешное подключение к Cosmos DB');
    } catch (err) {
        console.error('Ошибка подключения к Cosmos DB:', err);
        process.exit(1);
    }
};

connectDB();

// Модель пользователя
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 0 },
    transactions: [{
        type: { type: String, enum: ['buy', 'sell', 'exchange'] },
        amount: Number,
        price: Number,
        timestamp: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', UserSchema);

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Регистрация
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        console.log('Запрос на регистрацию:', { username, email });

        // Проверка существующего пользователя
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            console.log('Ошибка: Пользователь уже существует', { email, username });
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание нового пользователя
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();
        console.log('Пользователь успешно зарегистрирован:', { username, email });

        res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Вход
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Поиск пользователя
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Пользователь не найден' });
        }

        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Неверный пароль' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                coins: user.coins
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение данных пользователя
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление баланса монет
app.post('/api/user/coins', authenticateToken, async (req, res) => {
    try {
        const { amount, type } = req.body;
        const user = await User.findById(req.user.userId);

        if (type === 'add') {
            user.coins += amount;
        } else if (type === 'subtract') {
            if (user.coins < amount) {
                return res.status(400).json({ error: 'Недостаточно монет' });
            }
            user.coins -= amount;
        }

        await user.save();
        res.json({ coins: user.coins });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление транзакции
app.post('/api/user/transactions', authenticateToken, async (req, res) => {
    try {
        const { type, amount, price } = req.body;
        const user = await User.findById(req.user.userId);

        user.transactions.push({
            type,
            amount,
            price
        });

        await user.save();
        res.json(user.transactions);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение истории транзакций
app.get('/api/user/transactions', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json(user.transactions);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
}); 