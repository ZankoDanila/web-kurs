const jsonServer = require('json-server');
const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const app    = express();
const router = jsonServer.router('db.json');

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ success: false, message: 'Не переданы логин или пароль' });
    }

    const db = router.db;

    const client = db.get('clients')
        .find({ email: login.toLowerCase(), password_hash: password })
        .value();

    if (client) {
        return res.json({
            success:  true,
            role:     'client',
            userId:   client.id,
            fio:      client.fio,
            company:  client.company || '',
            position: client.position || '',
            email:    client.email,
            redirect: 'Cabinet.html'
        });
    }

    const admin = db.get('admins')
        .find({ username: login, password_hash: password })
        .value();

    if (admin) {
        return res.json({
            success:  true,
            role:     'admin',
            userId:   admin.id,
            username: admin.username,
            redirect: 'admin.html'
        });
    }

    return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
});

app.post('/api/register', (req, res) => {
    const {
        company, fio, position, email, phone,
        password, unp, address, departments_count
    } = req.body;

    if (!fio || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Заполните обязательные поля: ФИО, Email, Пароль'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Пароль должен содержать минимум 6 символов'
        });
    }

    const db = router.db;

    const existing = db.get('clients')
        .find({ email: email.toLowerCase() })
        .value();

    if (existing) {
        return res.status(400).json({ success: false, message: 'Этот email уже зарегистрирован' });
    }

    const newId = Date.now().toString();

    const newClient = {
        id:                newId,
        company:           (company || '').trim(),
        fio:               fio.trim(),
        position:          (position || '').trim(),
        email:             email.toLowerCase().trim(),
        phone:             (phone || '').trim(),
        password_hash:     password,
        unp:               (unp || '').trim(),
        address:           (address || '').trim(),
        departments_count: Number(departments_count) || 0,
        my_sensors:        []
    };

    db.get('clients').push(newClient).write();

    return res.status(201).json({
        success:  true,
        message:  'Регистрация прошла успешно',
        clientId: newId
    });
});

app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅  Сервер запущен:       http://localhost:${PORT}`);
    console.log(`📁  Статика из папки:     ${__dirname}`);
    console.log(`📡  REST API:             http://localhost:${PORT}/clients`);
    console.log(`🔐  Логин:                POST http://localhost:${PORT}/api/login`);
    console.log(`📝  Регистрация:          POST http://localhost:${PORT}/api/register`);
});
