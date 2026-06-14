(function () {
    'use strict';

    const API_URL = 'http://localhost:3000';

    const loginView     = document.getElementById('login-view');
    const registerView  = document.getElementById('register-view');
    const authCard      = document.getElementById('auth-card');

    const goToRegister  = document.getElementById('go-to-register');
    const goToLogin     = document.getElementById('go-to-login');

    const loginForm     = document.getElementById('login-form');
    const registerForm  = document.getElementById('register-form');

    const loginError    = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    function showError(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.style.display = 'block';
    }

    function hideError(el) {
        if (!el) return;
        el.style.display = 'none';
        el.textContent = '';
    }

    function setLoading(btn, loading) {
        btn.disabled = loading;
        btn.textContent = loading ? 'Подождите...' : btn.dataset.label;
    }

    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.dataset.label = btn.textContent;
    });

    if (goToRegister) {
        goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginView.classList.remove('active-view');
            loginView.classList.add('hidden');
            registerView.classList.remove('hidden');
            registerView.classList.add('active-view');
            hideError(loginError);
            hideError(registerError);
        });
    }

    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerView.classList.remove('active-view');
            registerView.classList.add('hidden');
            loginView.classList.remove('hidden');
            loginView.classList.add('active-view');
            hideError(loginError);
            hideError(registerError);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(loginError);

            const login    = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const btn      = loginForm.querySelector('.btn-primary');

            if (!login || !password) {
                showError(loginError, 'Введите логин и пароль');
                return;
            }

            setLoading(btn, true);

            try {
                const clientRes = await fetch(
                    `${API_URL}/clients?email=${encodeURIComponent(login)}&password_hash=${encodeURIComponent(password)}`
                );
                if (!clientRes.ok) throw new Error('Ошибка сервера');
                const clients = await clientRes.json();

                if (clients.length > 0) {
                    const client = clients[0];
                    localStorage.setItem('currentUser', JSON.stringify({
                        id:       client.id,
                        role:     'client',
                        fio:      client.fio,
                        email:    client.email,
                        company:  client.company || '',
                        position: client.position || ''
                    }));
                    window.location.href = 'Cabinet.html';
                    return;
                }

                const adminRes = await fetch(
                    `${API_URL}/admins?username=${encodeURIComponent(login)}&password_hash=${encodeURIComponent(password)}`
                );
                if (!adminRes.ok) throw new Error('Ошибка сервера');
                const admins = await adminRes.json();

                if (admins.length > 0) {
                    localStorage.setItem('currentUser', JSON.stringify({
                        id:       admins[0].id,
                        role:     'admin',
                        username: admins[0].username
                    }));
                    window.location.href = 'admin.html';
                    return;
                }

                throw new Error('Неверный логин или пароль');

            } catch (err) {
                showError(loginError, err.message);
            } finally {
                setLoading(btn, false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(registerError);

            const btn = registerForm.querySelector('.btn-primary');

            const formData = {
                company:           (document.getElementById('reg-company')?.value || '').trim(),
                fio:               document.getElementById('reg-fio').value.trim(),
                position:          document.getElementById('reg-position').value.trim(),
                email:             document.getElementById('reg-email').value.trim().toLowerCase(),
                phone:             document.getElementById('reg-phone').value.trim(),
                password_hash:     document.getElementById('reg-password').value,
                unp:               document.getElementById('reg-unp').value.trim(),
                address:           document.getElementById('reg-address').value.trim(),
                departments_count: Number(document.getElementById('reg-deps').value) || 0,
                my_sensors:        []
            };

            if (!formData.fio || !formData.email || !formData.password_hash) {
                showError(registerError, 'Заполните обязательные поля: ФИО, Email, Пароль');
                return;
            }

            if (formData.password_hash.length < 6) {
                showError(registerError, 'Пароль должен содержать минимум 6 символов');
                return;
            }

            setLoading(btn, true);

            try {
                const checkRes = await fetch(
                    `${API_URL}/clients?email=${encodeURIComponent(formData.email)}`
                );
                if (!checkRes.ok) throw new Error('Ошибка сервера при проверке email');
                const existing = await checkRes.json();
                if (existing.length > 0) throw new Error('Этот email уже зарегистрирован');

                formData.id = Date.now().toString();

                const postRes = await fetch(`${API_URL}/clients`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(formData)
                });
                if (!postRes.ok) throw new Error('Ошибка регистрации. Попробуйте позже');

                hideError(registerError);
                alert('Регистрация прошла успешно! Войдите в свой аккаунт.');
                if (goToLogin) goToLogin.click();

            } catch (err) {
                showError(registerError, err.message);
            } finally {
                setLoading(btn, false);
            }
        });
    }

})();
