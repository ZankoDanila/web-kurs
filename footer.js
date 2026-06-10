/**
 * Автоматическая загрузка и инициализация футера сайта
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Создаем базовый контейнер-обертку для футера
    const footerContainer = document.createElement('div');
    footerContainer.id = 'dynamic-footer-wrapper';

    // 2. Подгружаем HTML-содержимое футера
    // Если footer.html лежит в другой папке, скорректируйте путь (например, '/fragments/footer.html')
    fetch('footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки футера: ${response.status}`);
            }
            return response.text();
        })
        .then(htmlContent => {
            footerContainer.innerHTML = htmlContent;
            // 3. Ровно вставляем в самый конец тега body
            document.body.appendChild(footerContainer);
        })
        .catch(error => {
            console.error('Не удалось отобразить футер:', error);
        });
});
