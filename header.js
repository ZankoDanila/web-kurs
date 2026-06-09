document.addEventListener('DOMContentLoaded', () => {
    const placeholder = document.getElementById('header-placeholder');

    if (placeholder) {
        // Подгружаем внешний файл шапки
        fetch('header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Не удалось загрузить файл шапки');
                }
                return response.text();
            })
            .then(htmlContent => {
                // Вставляем полученный HTML в плейсхолдер
                placeholder.innerHTML = htmlContent;
                
                // А ТЕПЕРЬ запускаем всю логику навигации (когда элементы точно появились)
                initHeaderLogic();
            })
            .catch(error => {
                console.error('Ошибка интеграции компонента шапки:', error);
            });
    }
});

// Вся логика управления шапкой запускается только после успешного Fetch-инжекта
function initHeaderLogic() {
    
    // ==========================================================
    // ФУНКЦИЯ АВТОМАТИЧЕСКОЙ ПОДСВЕТКИ ССЫЛОК (ВАШ АЛГОРИТМ)
    // ==========================================================
    function updateActiveLinks() {
        let currentPath = window.location.pathname.split('/').pop() || 'index.html';
        let currentHash = window.location.hash;

        // Сбрасываем класс active у ссылок внутри уже созданной nav-panel
        document.querySelectorAll('.nav-panel a').forEach(el => el.classList.remove('active'));

        let activeId = 'nav-index'; // Дефолт

        if (currentPath === 'about.html') {
            activeId = 'nav-team';
        } else if (currentPath === 'details.html') {
            activeId = 'nav-developments';
        } else if (currentPath === 'index.html' || currentPath === '') {
            if (currentHash === '#experience') activeId = 'nav-developments';
            else if (currentHash === '#complectation') activeId = 'nav-system';
            else if (currentHash === '#team') activeId = 'nav-team';
            else if (currentHash === '#news') activeId = 'nav-news';
        }

        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Инициализируем подсветку
    updateActiveLinks();
    
    // Переключаем стили на лету, если пользователь ходит по якорям на главной
    window.addEventListener('hashchange', updateActiveLinks);


    // ==========================================================
    // ЛОГИКА ВЫЕЗЖАЮЩЕГО МОБИЛЬНОГО МЕНЮ (БУРГЕР)
    // ==========================================================
    const burgerBtn = document.getElementById('burgerBtn');
    const navPanel = document.getElementById('navPanel');

    if (burgerBtn && navPanel) {
        
        // Открытие-закрытие по клику на бургер
        burgerBtn.addEventListener('click', (event) => {
            event.stopPropagation(); 
            burgerBtn.classList.toggle('active'); 
            navPanel.classList.toggle('open');    
        });

        // Закрытие при выборе любого пункта меню
        navPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                burgerBtn.classList.remove('active');
                navPanel.classList.remove('open');
            });
        });

        // Закрытие по клику в любое пустое место экрана мимо меню
        document.addEventListener('click', (event) => {
            if (!navPanel.contains(event.target) && !burgerBtn.contains(event.target)) {
                burgerBtn.classList.remove('active');
                navPanel.classList.remove('open');
            }
        });
    }
}
