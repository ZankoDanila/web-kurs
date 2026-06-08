document.addEventListener('DOMContentLoaded', () => {
    // Получаем имя текущего файла из URL (например, "about.html" или пустую строку для корня)
    let currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    // Получаем якорь (хеш), если он есть (например, "#team")
    let currentHash = window.location.hash;

    // Сбрасываем класс .active у всех ссылок
    document.querySelectorAll('.nav-panel a').forEach(el => el.classList.remove('active'));

    // Логика определения: что сейчас подсвечивать
    let activeId = 'nav-index'; // По умолчанию ГЛАВНАЯ

    if (currentPath === 'about.html') {
        activeId = 'nav-team';
    } else if (currentPath === 'details.html') {
        activeId = 'nav-developments';
    } else if (currentPath === 'index.html' || currentPath === '') {
        // Если мы на главной, смотрим на якоря
        if (currentHash === '#experience') activeId = 'nav-developments';
        else if (currentHash === '#complectation') activeId = 'nav-system';
        else if (currentHash === '#team') activeId = 'nav-team';
        else if (currentHash === '#news') activeId = 'nav-news';
    }

    // Подсвечиваем нужный пункт
    const activeLink = document.getElementById(activeId);
    if (activeLink) {
        activeLink.classList.add('active');
    }
});
