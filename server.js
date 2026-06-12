const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Разрешаем кросс-доменные запросы (чтобы фронт на другом порту мог обращаться к API)
app.use(express.json()); // Парсим тело запроса как JSON

// Пути к файлам базы данных
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// --- Утилиты для работы с файлами (DRY паттерн) ---

// Асинхронное чтение JSON
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Ошибка чтения файла ${filePath}:`, error);
        throw new Error('Ошибка базы данных при чтении');
    }
}

// Асинхронная запись JSON
async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Ошибка записи в файл ${filePath}:`, error);
        throw new Error('Ошибка базы данных при записи');
    }
}

// --- ENDPOINTS (API) ---

/**
 * 1. POST /api/register - Регистрация B2B клиента
 */
app.post('/api/register', async (req, res) => {
    try {
        const { 
            fio, 
            position, 
            email, 
            phone, 
            password, 
            unp, 
            address, 
            departments_count,
            company // Добавили поле company, так как мы добавили его в архитектуру БД ранее
        } = req.body;

        // Базовая валидация (проверяем, что email и пароль точно пришли)
        if (!email || !password || !fio) {
            return res.status(400).json({ success: false, message: 'Не заполнены обязательные поля' });
        }

        // Читаем базу пользователей
        const usersData = await readJsonFile(USERS_FILE);

        // Проверяем, существует ли уже клиент с таким email
        const existingClient = usersData.clients.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (existingClient) {
            return res.status(400).json({ success: false, message: 'Email уже зарегистрирован' });
        }

        // Генерация нового ID (ищем максимальный ID и прибавляем 1)
        const maxId = usersData.clients.reduce((max, client) => (client.id > max ? client.id : max), 0);
        const newClientId = maxId + 1;

        // Формируем объект нового клиента
        const newClient = {
            id: newClientId,
            company: company || "Не указано",
            fio,
            position,
            email,
            phone,
            password_hash: password, // В реальном проекте здесь должен быть bcrypt.hash()
            unp,
            address,
            departments_count: Number(departments_count) || 0,
            my_sensors: [] // Инициализируем пустой массив оборудования
        };

        // Пушим в массив и сохраняем файл
        usersData.clients.push(newClient);
        await writeJsonFile(USERS_FILE, usersData);

        // Возвращаем успешный ответ
        return res.status(201).json({ 
            success: true, 
            message: 'Регистрация прошла успешно',
            clientId: newClientId
        });

    } catch (error) {
        console.error('Ошибка в /api/register:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

/**
 * 2. POST /api/login - Авторизация (Вход)
 */
app.post('/api/login', async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ success: false, message: 'Укажите логин и пароль' });
        }

        // Читаем базу пользователей
        const usersData = await readJsonFile(USERS_FILE);

        // 1. Ищем в администраторах
        const admin = usersData.admins.find(a => a.username === login && a.password_hash === password);
        if (admin) {
            return res.status(200).json({
                success: true,
                role: 'admin',
                redirect: 'admin.html'
            });
        }

        // 2. Ищем в клиентах (по email)
        const client = usersData.clients.find(c => c.email.toLowerCase() === login.toLowerCase() && c.password_hash === password);
        if (client) {
            return res.status(200).json({
                success: true,
                role: 'client',
                userId: client.id,
                fio: client.fio,
                position: client.position,
                redirect: 'Cabinet.html'
            });
        }

        // 3. Если никто не найден
        return res.status(401).json({ 
            success: false, 
            message: 'Неверный логин или пароль' 
        });

    } catch (error) {
        console.error('Ошибка в /api/login:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

// --- Запуск сервера ---
app.listen(PORT, () => {
    console.log(`🚀 B2B Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Папка с данными ожидается по пути: ${DATA_DIR}`);
});
