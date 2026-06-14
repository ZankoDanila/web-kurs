(function() {
    const API_URL = 'http://localhost:3000';

    const formatNumber = (num) => new Intl.NumberFormat('ru-RU').format(num);
    const formatDate = (dateStr) => dateStr ? dateStr.split('-').reverse().join('.') : '—';
    const escapeHtml = (str) => str ? String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]||m)) : '';

    let currentUser = null;

    async function loadCabinet() {
        try {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
        } catch(e) {}
        if (!currentUser || currentUser.role !== 'client') {
            window.location.href = 'index.html';
            return;
        }

        const userId = currentUser.userId || currentUser.id;
        try {
            const [clientRes, estimatesRes, sensorsRes] = await Promise.all([
                fetch(`${API_URL}/clients/${userId}`),
                fetch(`${API_URL}/estimates?client_id=${userId}`),
                fetch(`${API_URL}/sensors`)
            ]);
            if (!clientRes.ok) throw new Error('Ошибка загрузки профиля');
            const client = await clientRes.json();
            const estimates = await estimatesRes.json();
            const sensors = await sensorsRes.json();

            // 1. Заполнение профиля и боковой панели
            document.querySelector('.profile-card__company').textContent = client.company || '—';
            document.querySelector('.profile-card__name').textContent = client.fio || '—';
            document.querySelector('.profile-card__role').textContent = client.position || '—';
            const contacts = document.querySelectorAll('.profile-card__contact');
            if (contacts.length >= 2) {
                contacts[0].textContent = client.email || '—';
                contacts[1].textContent = client.phone || '—';
            }
            const avatarLetter = client.fio ? client.fio.charAt(0).toUpperCase() : 'П';
            document.querySelector('.profile-card__avatar').textContent = avatarLetter;
            document.querySelector('.sidebar__company').textContent = client.company || '—';
            document.querySelector('.sidebar__avatar').textContent = avatarLetter;
            const sidebarSurname = document.querySelector('.sidebar__surname');
            if (sidebarSurname) {
                sidebarSurname.textContent = client.fio ? client.fio.split(' ')[0].toUpperCase() : '—';
            }

            // 2. История заказов (таблица estimates) – сортируем по дате создания (новые сверху)
            const sortedEstimates = [...estimates].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const tbody = document.getElementById('orders-table-body');
            if (tbody) {
                tbody.innerHTML = '';
                if (sortedEstimates.length === 0) {
                    tbody.innerHTML = '<td><td colspan="7">У вас пока нет завершённых заказов</td></tr>';
                } else {
                    sortedEstimates.forEach(order => {
                        const sensor = sensors.find(s => s.id == order.sensor_id);
                        const sensorName = sensor ? sensor.title : 'Неизвестный прибор';
                        const sensorLogo = sensor?.image || sensor?.logo || 'img/icon.svg';
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td class="orders-history__td">
                                <div class="orders-history__device">
                                    <img src="${sensorLogo}" class="orders-history__device-icon" alt="${sensorName}" />
                                    <div>
                                        <p class="orders-history__device-name">${escapeHtml(sensorName)}</p>
                                        <p class="orders-history__device-serial">ID: ${order.sensor_id}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="orders-history__td orders-history__td--num">х${order.registrators_count || 0}</td>
                            <td class="orders-history__td orders-history__td--num">х${order.rooms_count || 0}</td>
                            <td class="orders-history__td">${escapeHtml(order.additional_modules || '—')}</td>
                            <td class="orders-history__td orders-history__td--date">${formatDate(order.created_at)}</td>
                            <td class="orders-history__td orders-history__td--date">${formatDate(order.received_at)}</td>
                            <td class="orders-history__td orders-history__td--sum">${formatNumber(order.amount)} руб.</td>
                        `;
                        tbody.appendChild(row);
                    });
                }
            }

            if (sortedEstimates.length > 0) {
                const current = sortedEstimates[0];
                const sensor = sensors.find(s => s.id == current.sensor_id);
                const sensorName = sensor ? sensor.title : 'Регистратор';
                const sensorLogo = sensor?.image || sensor?.logo || 'img/image.svg';
                const count = current.registrators_count || 1;
                const pricePerUnit = formatNumber(Math.round(current.amount / count));
                const statusMap = {
                    'pending': 'на рассмотрении',
                    'on_approval': 'проектируем',
                    'approved': 'утверждено',
                    'in_production': 'в производстве',
                    'ready': 'готово',
                    'rejected': 'отклонено'
                };
                const statusText = statusMap[current.status] || current.status || '—';
                document.querySelector('.order-card__status').textContent = statusText;
                document.querySelector('.order-card__item-icon').src = sensorLogo;
                document.querySelector('.order-card__item-name').textContent = sensorName;
                document.querySelector('.order-card__item-serial').textContent = `ID: ${current.sensor_id}`;
                document.querySelector('.order-card__item-price').textContent = `${pricePerUnit} руб.`;
                document.querySelector('.order-card__total-unit').textContent = `${pricePerUnit} х${count}`;
                document.querySelector('.order-card__total-sum').textContent = `итого: ${formatNumber(current.amount)} руб.`;
                document.querySelector('.order-card__desc-text').textContent = current.description || '—';
                const qtyList = document.querySelector('.order-card__qty-list');
                if (qtyList) {
                    qtyList.innerHTML = `<li>${count} регистраторов</li><li>${current.rooms_count || 0} помещений</li>`;
                }
            } else {
                document.querySelector('.order-card__status').textContent = 'Нет активных заказов';
            }
        } catch (err) {
            console.error('Ошибка загрузки кабинета:', err);
            document.getElementById('orders-table-body').innerHTML = '<tr><td colspan="7" style="color:red;">Ошибка загрузки данных</td></tr>';
        }
    }

    // ========== МОДАЛКА ЗАКАЗА ==========
    const orderModal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    const sensorSelect = document.getElementById('order-sensor');
    async function loadSensorsToSelect() {
        const res = await fetch(`${API_URL}/sensors`);
        const sensors = await res.json();
        sensorSelect.innerHTML = sensors.map(s => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('');
    }
    document.querySelector('.sidebar__btn[href="#order"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        loadSensorsToSelect();
        orderModal.classList.add('open');
    });
    document.getElementById('close-order-modal')?.addEventListener('click', () => orderModal.classList.remove('open'));
    orderForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const payload = {
            client_id: currentUser.userId || currentUser.id,
            sensor_id: parseInt(sensorSelect.value),
            registrators_count: parseInt(document.getElementById('order-reg-count').value),
            rooms_count: parseInt(document.getElementById('order-rooms-count').value),
            additional_modules: document.getElementById('order-modules').value,
            description: document.getElementById('order-desc').value,
            status: 'pending',
            created_at: new Date().toISOString().slice(0,10),
            estimate_amount: null
        };
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Заявка отправлена! Администратор выставит смету.');
            orderModal.classList.remove('open');
            orderForm.reset();
        } else alert('Ошибка отправки');
    });

    // ========== МОДАЛКА ДОРАБОТКИ ==========
    const upgradeModal = document.getElementById('upgrade-modal');
    const upgradeForm = document.getElementById('upgrade-form');
    document.querySelector('.sidebar__btn[href="#upgrades"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        upgradeModal.classList.add('open');
    });
    document.getElementById('close-upgrade-modal')?.addEventListener('click', () => upgradeModal.classList.remove('open'));
    upgradeForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const payload = {
            client_id: currentUser.userId || currentUser.id,
            type: document.getElementById('upgrade-type').value,
            description: document.getElementById('upgrade-desc').value,
            status: 'pending',
            created_at: new Date().toISOString().slice(0,10),
            estimate_amount: null
        };
        const res = await fetch(`${API_URL}/upgrade_requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Запрос на доработку отправлен.');
            upgradeModal.classList.remove('open');
            upgradeForm.reset();
        } else alert('Ошибка отправки');
    });

    // ========== МОДАЛКА СМЕТ ==========
    const estimatesModal = document.getElementById('estimates-modal');
    const estimatesContainer = document.getElementById('estimates-list-container');

    async function loadEstimates() {
        if (!currentUser) return;
        const userId = currentUser.userId || currentUser.id;

        const [ordersRes, upgradesRes] = await Promise.all([
            fetch(`${API_URL}/orders?client_id=${userId}`),
            fetch(`${API_URL}/upgrade_requests?client_id=${userId}`)
        ]);
        let orders = await ordersRes.json();
        let upgrades = await upgradesRes.json();

        orders = orders.filter(o => o.status === 'on_approval' && o.estimate_amount != null);
        upgrades = upgrades.filter(u => u.status === 'on_approval' && u.estimate_amount != null);

        if (orders.length === 0 && upgrades.length === 0) {
            estimatesContainer.innerHTML = '<p>Нет новых предложений смет.</p>';
            return;
        }

        let html = '';
        for (let order of orders) {
            const sensorRes = await fetch(`${API_URL}/sensors/${order.sensor_id}`);
            const sensor = await sensorRes.json();
            const safeOrderId = String(order.id).replace(/'/g, "\\'");
            html += `
                <div class="estimate-item" data-id="${order.id}" data-type="order">
                    <div><strong>Заказ №${order.id}</strong> — ${escapeHtml(sensor.title)}</div>
                    <div>Кол-во: ${order.registrators_count} шт., помещений: ${order.rooms_count}</div>
                    <div>Предложенная сумма: <strong>${formatNumber(order.estimate_amount)} руб.</strong></div>
                    <div class="estimate-actions">
                        <button class="btn--confirm btn--small" onclick="window.confirmEstimate('${safeOrderId}', 'order')">✅ Подтвердить</button>
                        <button class="btn--reject btn--small" onclick="window.rejectEstimate('${safeOrderId}', 'order')">❌ Отказаться</button>
                    </div>
                </div>`;
        }
        for (let req of upgrades) {
            const safeReqId = String(req.id).replace(/'/g, "\\'");
            html += `
                <div class="estimate-item" data-id="${req.id}" data-type="upgrade">
                    <div><strong>Доработка №${req.id}</strong> — ${req.type === 'web' ? 'Веб-часть' : 'Аппаратная часть'}</div>
                    <div>Описание: ${escapeHtml(req.description)}</div>
                    <div>Предложенная сумма: <strong>${formatNumber(req.estimate_amount)} руб.</strong></div>
                    <div class="estimate-actions">
                        <button class="btn--confirm btn--small" onclick="window.confirmEstimate('${safeReqId}', 'upgrade')">✅ Подтвердить</button>
                        <button class="btn--reject btn--small" onclick="window.rejectEstimate('${safeReqId}', 'upgrade')">❌ Отказаться</button>
                    </div>
                </div>`;
        }
        estimatesContainer.innerHTML = html;
    }

    document.querySelector('.sidebar__btn[href="#estimate"]')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadEstimates();
        estimatesModal.classList.add('open');
    });
    document.getElementById('close-estimates-modal')?.addEventListener('click', () => estimatesModal.classList.remove('open'));

    window.confirmEstimate = async (id, type) => {
        const endpoint = type === 'order' ? 'orders' : 'upgrade_requests';
        try {
            const res = await fetch(`${API_URL}/${endpoint}/${id}`);
            if (!res.ok) throw new Error('Не удалось загрузить данные заявки');
            const item = await res.json();
            if (type === 'order') {
                const newEstimate = {
                    client_id: item.client_id,
                    sensor_id: item.sensor_id,
                    registrators_count: item.registrators_count,
                    rooms_count: item.rooms_count,
                    additional_modules: item.additional_modules,
                    created_at: item.created_at,
                    received_at: new Date().toISOString().slice(0,10),
                    amount: item.estimate_amount,
                    status: 'approved',
                    description: item.description
                };
                await fetch(`${API_URL}/estimates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newEstimate)
                });
                await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
            } else {
                await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
            }
            alert('Смета подтверждена! Заказ передан в производство.');
            estimatesModal.classList.remove('open');
            loadCabinet();
        } catch (err) {
            console.error('Ошибка подтверждения сметы:', err);
            alert('Ошибка при подтверждении сметы');
        }
    };

    window.rejectEstimate = async (id, type) => {
        const endpoint = type === 'order' ? 'orders' : 'upgrade_requests';
        try {
            await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
            alert('Вы отказались от сметы.');
            estimatesModal.classList.remove('open');
            loadCabinet();
        } catch (err) {
            console.error('Ошибка отклонения сметы:', err);
            alert('Ошибка при отказе от сметы');
        }
    };

    // ========== РЕДАКТИРОВАНИЕ ПРОФИЛЯ ==========
    const editModal = document.getElementById('edit-profile-modal');
    let currentClientData = null;

    function fillEditForm(client) {
        document.getElementById('edit-company').value = client.company || '';
        document.getElementById('edit-fio').value = client.fio || '';
        document.getElementById('edit-position').value = client.position || '';
        document.getElementById('edit-email').value = client.email || '';
        document.getElementById('edit-phone').value = client.phone || '';
        document.getElementById('edit-unp').value = client.unp || '';
        document.getElementById('edit-address').value = client.address || '';
        document.getElementById('edit-departments').value = client.departments_count || 0;
        currentClientData = client;
    }

    document.getElementById('edit-profile-btn')?.addEventListener('click', async () => {
        const userId = currentUser?.userId || currentUser?.id;
        if (!userId) return;
        try {
            const res = await fetch(`${API_URL}/clients/${userId}`);
            const client = await res.json();
            fillEditForm(client);
            editModal.classList.add('open');
        } catch (err) {
            console.error(err);
            alert('Не удалось загрузить данные профиля');
        }
    });

    document.getElementById('close-edit-modal')?.addEventListener('click', () => editModal.classList.remove('open'));
    document.getElementById('cancel-edit')?.addEventListener('click', () => editModal.classList.remove('open'));

    document.getElementById('save-edit')?.addEventListener('click', async () => {
        const userId = currentUser?.userId || currentUser?.id;
        if (!userId) return;

        const updatedData = {
            company: document.getElementById('edit-company').value,
            fio: document.getElementById('edit-fio').value,
            position: document.getElementById('edit-position').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            unp: document.getElementById('edit-unp').value,
            address: document.getElementById('edit-address').value,
            departments_count: parseInt(document.getElementById('edit-departments').value) || 0
        };

        try {
            const res = await fetch(`${API_URL}/clients/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) throw new Error('Ошибка при сохранении');

            if (currentUser) {
                currentUser.fio = updatedData.fio;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }

            alert('Профиль успешно обновлён!');
            editModal.classList.remove('open');
            loadCabinet();
        } catch (err) {
            console.error(err);
            alert('Не удалось сохранить изменения');
        }
    });

    editModal?.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.remove('open');
    });

    document.querySelector('.sidebar__logout')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    document.addEventListener('DOMContentLoaded', loadCabinet);
})();
