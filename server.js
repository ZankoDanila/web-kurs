const path = require('path');

// Добавляем node_modules в путь поиска
const nodeModulesPath = path.join(__dirname, 'node_modules');
require('module').globalPaths.push(nodeModulesPath);

const jsonServer = require('json-server');
const cors = require('cors');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(cors());
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Кастомный логин
server.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  const db = router.db;

  const client = db.get('clients').find({ email: login, password_hash: password }).value();
  if (client) {
    return res.json({
      success: true,
      role: 'client',
      userId: client.id,
      fio: client.fio,
      position: client.position,
      redirect: 'Cabinet.html'
    });
  }

  const admin = db.get('admins').find({ username: login, password_hash: password }).value();
  if (admin) {
    return res.json({
      success: true,
      role: 'admin',
      userId: admin.id,
      redirect: 'admin.html'
    });
  }

  res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
});

// Кастомная регистрация
server.post('/api/register', (req, res) => {
  const { fio, position, email, phone, password, unp, address, departments_count, company } = req.body;

  if (!email || !password || !fio) {
    return res.status(400).json({ success: false, message: 'Заполните обязательные поля' });
  }

  const db = router.db;
  const existing = db.get('clients').find({ email }).value();
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email уже зарегистрирован' });
  }

  const clients = db.get('clients').value();
  const maxId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) : 0;
  const newId = maxId + 1;

  const newClient = {
    id: newId,
    company: company || '',
    fio,
    position,
    email,
    phone,
    password_hash: password,
    unp,
    address,
    departments_count: Number(departments_count) || 0,
    my_sensors: []
  };

  db.get('clients').push(newClient).write();

  res.status(201).json({ success: true, message: 'Регистрация успешна', clientId: newId });
});

server.use('/api', router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`📁 Статика из папки public/`);
});
