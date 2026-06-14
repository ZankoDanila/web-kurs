document.addEventListener("DOMContentLoaded", () => {
    const footerContainer = document.createElement('div');
    footerContainer.id = 'dynamic-footer-wrapper';

    fetch('footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки футера: ${response.status}`);
            }
            return response.text();
        })
        .then(htmlContent => {
            footerContainer.innerHTML = htmlContent;
            document.body.appendChild(footerContainer);
        })
        .catch(error => {
            console.error('Не удалось отобразить футер:', error);
        });
});
