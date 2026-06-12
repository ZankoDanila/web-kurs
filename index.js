// index.js – единый файл для страницы входа/регистрации (auth.html или index.html)
(function() {
    'use strict';

    const API_URL = 'http://localhost:3000';

    // DOM элементы
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const authCard = document.getElementById('auth-card');

    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // Переключение на форму регистрации
    if (goToRegister) {
        goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginView.classList.remove('active-view');
            registerView.classList.add('active-view');
            if (authCard) authCard.classList.add('expanded');
        });
    }

    // Переключение на форму входа
    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerView.classList.remove('active-view');
            loginView.classList.add('active-view');
            if (authCard) authCard.classList.remove('expanded');
        });
    }

    // ------------------- ЛОГИН -------------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            // Скрываем предыдущие ошибки
            if (loginError) loginError.style.display = 'none';

            try {
                // 1. Ищем среди клиентов
                const clientRes = await fetch(`${API_URL}/clients?email=${encodeURIComponent(login)}&password_hash=${encodeURIComponent(password)}`);
                const clients = await clientRes.json();

                if (clients.length > 0) {
                    const client = clients[0];
                    localStorage.setItem('currentUser', JSON.stringify({
                        id: client.id,
                        role: 'client',
                        fio: client.fio,
                        email: client.email
                    }));
                    window.location.href = 'Cabinet.html';
                    return;
                }

                // 2. Ищем среди администраторов
                const adminRes = await fetch(`${API_URL}/admins?username=${encodeURIComponent(login)}&password_hash=${encodeURIComponent(password)}`);
                const admins = await adminRes.json();

                if (admins.length > 0) {
                    localStorage.setItem('currentUser', JSON.stringify({
                        id: admins[0].id,
                        role: 'admin',
                        username: admins[0].username
                    }));
                    window.location.href = 'admin.html';  // если есть админка
                    return;
                }

                throw new Error('Неверный логин или пароль');
            } catch (err) {
                if (loginError) {
                    loginError.style.display = 'block';
                    loginError.innerText = err.message;
                } else {
                    alert(err.message);
                }
            }
        });
    }

    // ------------------- РЕГИСТРАЦИЯ -------------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                company: document.getElementById('reg-company')?.value || '',
                fio: document.getElementById('reg-fio').value.trim(),
                position: document.getElementById('reg-position').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                phone: document.getElementById('reg-phone').value.trim(),
                password_hash: document.getElementById('reg-password').value,
                unp: document.getElementById('reg-unp').value.trim(),
                address: document.getElementById('reg-address').value.trim(),
                departments_count: Number(document.getElementById('reg-deps').value) || 0,
                my_sensors: []
            };

            if (!formData.email || !formData.password_hash || !formData.fio) {
                if (registerError) {
                    registerError.style.display = 'block';
                    registerError.innerText = 'Заполните обязательные поля';
                }
                return;
            }

            try {
                // Проверяем, не занят ли email
                const checkRes = await fetch(`${API_URL}/clients?email=${encodeURIComponent(formData.email)}`);
                const existing = await checkRes.json();
                if (existing.length > 0) throw new Error('Email уже зарегистрирован');

                // Отправляем POST на /clients
                const postRes = await fetch(`${API_URL}/clients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!postRes.ok) throw new Error('Ошибка регистрации');

                alert('Регистрация успешна! Теперь войдите.');
                // Переключаем на форму входа
                if (goToLogin) goToLogin.click();
            } catch (err) {
                if (registerError) {
                    registerError.style.display = 'block';
                    registerError.innerText = err.message;
                } else {
                    alert(err.message);
                }
            }
        });
    }
})();
