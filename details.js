document.addEventListener('DOMContentLoaded', async () => {
    try {
        // ИСПРАВЛЕНО: Указано верное имя файла без лишних точек
        const response = await fetch('db.json'); 
        if (!response.ok) throw new Error('Не удалось загрузить db.json');
        
        const data = await response.json();
const products = data.sensors;
        const mainContainer = document.getElementById('all-products-container');

        if (!mainContainer) {
            console.error("Контейнер #all-products-container не найден в HTML!");
            return;
        }

        mainContainer.innerHTML = '';

        // Перебираем абсолютно все датчики из базы данных
        products.forEach(product => {
            // Создаем обертку-строку для каждого датчика, чтобы изолировать стили
            const rowWrapper = document.createElement('div');
            rowWrapper.className = 'product-row-wrapper';
            
            const cards = product.cards || [];

            rowWrapper.innerHTML = `
                <div class="figma-exact-container">
                    <div class="details-header-row">
                        <div class="title-company-group">
                            <h1 class="exact-title">${product.title}</h1>
                            <div class="exact-divider"></div>
                            <div class="exact-company">${product.company}</div>
                        </div>
                        <div class="exact-actions">
                            <button class="exact-btn btn-secondary">ПОДРОБНЕЕ</button>
                            <button class="exact-btn btn-primary">ЗАКАЗАТЬ</button>
                        </div>
                    </div>

                    <div class="details-columns-row">
                        <div class="exact-col-left">
                            <img src="${product.image || 'https://placehold.co/707x409'}" alt="${product.title}" class="exact-image">
                            ${cards[0] ? `
                                <div class="exact-card card-bl">
                                    <h3 class="exact-card-title">${cards[0].title}</h3>
                                    <p class="exact-card-text">${cards[0].text}</p>
                                </div>
                            ` : ''}
                        </div>

                        <div class="exact-col-right">
                            ${cards[1] ? `
                                <div class="exact-card card-tr">
                                    <h3 class="exact-card-title">${cards[1].title}</h3>
                                    <p class="exact-card-text">${cards[1].text}</p>
                                </div>
                            ` : ''}
                            
                            ${cards[2] ? `
                                <div class="exact-card card-br">
                                    <h3 class="exact-card-title">${cards[2].title}</h3>
                                    <p class="exact-card-text">${cards[2].text}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;

            mainContainer.appendChild(rowWrapper);
        });

    } catch (error) {
        console.error("Ошибка рендеринга:", error);
    }
});
