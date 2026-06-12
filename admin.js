// admin.js – полная версия с обработкой через делегирование событий
(function() {
    const API_URL = 'http://localhost:3000';
    let toastTimer = null;
    let currentEstimateTarget = null; // { type: 'order' или 'upgrade', id: number }

    // Вспомогательные функции
    const formatNumber = (num) => new Intl.NumberFormat('ru-RU').format(num);
    const formatDate = (dateStr) => dateStr ? dateStr.split('-').reverse().join('.') : '—';
    const escapeHtml = (str) => str ? String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]||m)) : '';
    
    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        document.getElementById('toast-msg').textContent = msg;
        toast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
    }

    // Проверка авторизации (только админ)
    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem('currentUser')); } catch(e) {}
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    const adminNameSpan = document.getElementById('admin-name');
    if (adminNameSpan) adminNameSpan.textContent = currentUser.username || 'Главный';

    // Глобальные кэши
    let clientsMap = {};   // id -> клиент
    let sensorsMap = {};   // id -> датчик
    let orders = [];
    let upgrades = [];
    let estimates = [];

    // Загрузка всех данных
    async function loadAllData() {
        try {
            const [clientsRes, sensorsRes, ordersRes, upgradesRes, estimatesRes] = await Promise.all([
                fetch(`${API_URL}/clients`),
                fetch(`${API_URL}/sensors`),
                fetch(`${API_URL}/orders`),
                fetch(`${API_URL}/upgrade_requests`),
                fetch(`${API_URL}/estimates`)
            ]);
            const clients = await clientsRes.json();
            const sensors = await sensorsRes.json();
            orders = await ordersRes.json();
            upgrades = await upgradesRes.json();
            estimates = await estimatesRes.json();

            clients.forEach(c => { clientsMap[c.id] = c; });
            sensors.forEach(s => { sensorsMap[s.id] = s; });

            renderOrdersTable();
            renderUpgradesTable();
            renderEstimatesTable();
            renderClientsEquipment();
            updateCounters();
        } catch (err) {
            console.error(err);
            showToast('Ошибка загрузки данных');
        }
    }

    // Рендер таблицы заявок на заказы (status = pending)
    function renderOrdersTable() {
        const tbody = document.getElementById('orders-tbody');
        if (!tbody) return;
        const pendingOrders = orders.filter(o => o.status === 'pending');
        if (pendingOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9">Нет новых заявок</td></tr>';
            return;
        }
        tbody.innerHTML = pendingOrders.map(order => {
            const client = clientsMap[order.client_id] || { company: 'Неизвестно' };
            const sensor = sensorsMap[order.sensor_id] || { title: 'Неизвестный прибор' };
            return `
                <tr data-id="${order.id}" data-type="order">
                    <td>${order.id}</td>
                    <td>${escapeHtml(client.company)}</td>
                    <td>${escapeHtml(sensor.title)}</td>
                    <td>${order.registrators_count}</td>
                    <td>${order.rooms_count}</td>
                    <td>${escapeHtml(order.additional_modules || '—')}</td>
                    <td>${formatDate(order.created_at)}</td>
                    <td><span class="badge badge--pending">Новая</span></td>
                    <td><button class="btn btn--primary btn--sm estimate-btn" data-type="order" data-id="${order.id}" data-company="${escapeHtml(client.company)}">Выставить смету</button></td>
                </tr>
            `;
        }).join('');
    }

    // Рендер заявок на доработки (status = pending)
    function renderUpgradesTable() {
        const tbody = document.getElementById('upgrades-tbody');
        if (!tbody) return;
        const pendingUpgrades = upgrades.filter(u => u.status === 'pending');
        if (pendingUpgrades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Нет заявок на доработки</td></tr>';
            return;
        }
        tbody.innerHTML = pendingUpgrades.map(req => {
            const client = clientsMap[req.client_id] || { company: 'Неизвестно' };
            return `
                <tr data-id="${req.id}" data-type="upgrade">
                    <td>${req.id}</td>
                    <td>${escapeHtml(client.company)}</td>
                    <td>${req.type === 'web' ? 'Веб-часть' : 'Аппаратная часть'}</td>
                    <td>${escapeHtml(req.description)}</td>
                    <td>${formatDate(req.created_at)}</td>
                    <td><span class="badge badge--pending">Новая</span></td>
                    <td><button class="btn btn--primary btn--sm estimate-btn" data-type="upgrade" data-id="${req.id}" data-company="${escapeHtml(client.company)}">Выставить смету</button></td>
                </tr>
            `;
        }).join('');
    }

    // Рендер заказов в производстве (estimates)
    function renderEstimatesTable() {
        const tbody = document.getElementById('estimates-tbody');
        if (!tbody) return;
        if (estimates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Нет заказов в работе</td></tr>';
            return;
        }
        tbody.innerHTML = estimates.map(est => {
            const client = clientsMap[est.client_id] || { company: 'Неизвестно' };
            const sensor = sensorsMap[est.sensor_id] || { title: 'Неизвестный прибор' };
            const statusText = { approved: 'Утверждён', in_production: 'В производстве', ready: 'Готов к отгрузке' };
            return `
                <tr data-id="${est.id}">
                    <td>${est.id}</td>
                    <td>${escapeHtml(client.company)}</td>
                    <td>${escapeHtml(sensor.title)}</td>
                    <td>${est.registrators_count}</td>
                    <td>${formatNumber(est.amount)} руб.</td>
                    <td><span class="badge ${est.status === 'in_production' ? 'badge--production' : (est.status === 'ready' ? 'badge--ready' : 'badge--approved')}">${statusText[est.status] || est.status}</span></td>
                    <td>
                        <select class="status-select" data-id="${est.id}">
                            <option value="">Изменить статус</option>
                            <option value="in_production" ${est.status === 'in_production' ? 'selected' : ''}>В производство</option>
                            <option value="ready" ${est.status === 'ready' ? 'selected' : ''}>Готов к отгрузке</option>
                        </select>
                     </td>
                </tr>
            `;
        }).join('');
    }

    // Оборудование клиентов (аккордеон)
    function renderClientsEquipment() {
        const container = document.getElementById('client-list');
        if (!container) return;
        const clients = Object.values(clientsMap);
        if (clients.length === 0) {
            container.innerHTML = '<li>Нет клиентов</li>';
            return;
        }
        container.innerHTML = clients.map(client => {
            const sensorsList = (client.my_sensors || []).map(ms => {
                const sensor = sensorsMap[ms.sensor_id];
                const sensorName = sensor ? sensor.title : `Датчик ID ${ms.sensor_id}`;
                const serials = ms.serial_numbers ? ms.serial_numbers.join(', ') : '—';
                return `
                    <tr>
                        <td>${escapeHtml(sensorName)}</td>
                        <td class="serial">${escapeHtml(serials)}</td>
                        <td>—</td>
                    </tr>
                `;
            }).join('');
            const hasSensors = sensorsList.length > 0;
            return `
                <li class="client-item" data-client-id="${client.id}">
                    <button class="client-toggle" aria-expanded="false">
                        <div class="client-toggle__info">
                            <div class="client-avatar">${escapeHtml(client.company.charAt(0).toUpperCase())}</div>
                            <div>
                                <div class="client-toggle__name">${escapeHtml(client.company)}</div>
                                <div class="client-toggle__meta">${client.my_sensors?.length || 0} приборов</div>
                            </div>
                        </div>
                        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div class="client-sensors">
                        <table class="sensors-table">
                            <thead><tr><th>Название прибора</th><th>Серийные номера</th><th>Дата привязки</th></tr></thead>
                            <tbody>${hasSensors ? sensorsList : '<tr><td colspan="3">Нет оборудования</td></tr>'}</tbody>
                        </table>
                    </div>
                </li>
            `;
        }).join('');
    }

    function updateCounters() {
        const ordersCountSpan = document.getElementById('orders-count');
        const upgradesCountSpan = document.getElementById('upgrades-count');
        const estimatesCountSpan = document.getElementById('estimates-count');
        const clientsCountSpan = document.getElementById('clients-count');
        if (ordersCountSpan) ordersCountSpan.textContent = orders.filter(o => o.status === 'pending').length;
        if (upgradesCountSpan) upgradesCountSpan.textContent = upgrades.filter(u => u.status === 'pending').length;
        if (estimatesCountSpan) estimatesCountSpan.textContent = estimates.length;
        if (clientsCountSpan) clientsCountSpan.textContent = Object.keys(clientsMap).length;
    }

    // ---- Модальное окно сметы ----
    function openEstimateModal(type, id, companyName) {
        currentEstimateTarget = { type, id };
        document.getElementById('modal-client').textContent = companyName;
        document.getElementById('modal-item-id').textContent = `${type.toUpperCase()}-${id}`;
        document.getElementById('estimate-amount').value = '';
        document.getElementById('estimate-comment').value = '';
        document.getElementById('estimate-modal').classList.add('open');
    }

    function closeEstimateModal() {
        document.getElementById('estimate-modal').classList.remove('open');
        currentEstimateTarget = null;
    }

    async function submitEstimate() {
        if (!currentEstimateTarget) return;
        const amount = parseFloat(document.getElementById('estimate-amount').value);
        if (isNaN(amount) || amount <= 0) {
            showToast('Введите корректную сумму');
            return;
        }
        const comment = document.getElementById('estimate-comment').value;
        const { type, id } = currentEstimateTarget;
        const endpoint = type === 'order' ? 'orders' : 'upgrade_requests';
        try {
            const patchRes = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'on_approval', estimate_amount: amount, admin_comment: comment })
            });
            if (!patchRes.ok) throw new Error('Ошибка обновления');
            showToast(`Смета на сумму ${formatNumber(amount)} руб. отправлена клиенту.`);
            closeEstimateModal();
            loadAllData();
        } catch (err) {
            console.error(err);
            showToast('Ошибка отправки сметы');
        }
    }

    async function changeEstimateStatus(estimateId, newStatus) {
        if (!newStatus) return;
        try {
            const res = await fetch(`${API_URL}/estimates/${estimateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                showToast(`Статус заказа #${estimateId} изменён на "${newStatus === 'in_production' ? 'В производстве' : 'Готов к отгрузке'}"`);
                loadAllData();
            } else throw new Error();
        } catch(err) {
            showToast('Ошибка изменения статуса');
        }
    }

    // Аккордеон для клиентов
    function toggleClient(clientItem) {
        const isOpen = clientItem.classList.contains('open');
        document.querySelectorAll('.client-item').forEach(el => {
            el.classList.remove('open');
            const btn = el.querySelector('.client-toggle');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
            clientItem.classList.add('open');
            const btn = clientItem.querySelector('.client-toggle');
            if (btn) btn.setAttribute('aria-expanded', 'true');
        }
    }

    // ---- Обработчики через делегирование ----
    function setupEventDelegation() {
        // Делегирование для кнопок "Выставить смету"
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.estimate-btn');
            if (btn) {
                e.preventDefault();
                const type = btn.getAttribute('data-type');
                const id = parseInt(btn.getAttribute('data-id'));
                const company = btn.getAttribute('data-company');
                if (type && id && company) {
                    openEstimateModal(type, id, company);
                }
            }
        });

        // Делегирование для select изменения статуса
        document.body.addEventListener('change', (e) => {
            const select = e.target.closest('.status-select');
            if (select) {
                const estimateId = parseInt(select.getAttribute('data-id'));
                const newStatus = select.value;
                if (estimateId && newStatus) {
                    changeEstimateStatus(estimateId, newStatus);
                }
            }
        });

        // Делегирование для аккордеона клиентов
        document.body.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.client-toggle');
            if (toggleBtn) {
                const parentItem = toggleBtn.closest('.client-item');
                if (parentItem) toggleClient(parentItem);
            }
        });
    }

    // Выход
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Модальное окно: закрытие
    document.getElementById('close-estimate-modal')?.addEventListener('click', closeEstimateModal);
    document.getElementById('cancel-estimate')?.addEventListener('click', closeEstimateModal);
    document.getElementById('submit-estimate')?.addEventListener('click', submitEstimate);
    document.getElementById('estimate-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('estimate-modal')) closeEstimateModal();
    });

    // Инициализация
    setupEventDelegation();
    loadAllData();
})();
