document.addEventListener('DOMContentLoaded', () => {
    const placeholder = document.getElementById('header-placeholder');

    if (placeholder) {
        fetch('header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Не удалось загрузить файл шапки');
                }
                return response.text();
            })
            .then(htmlContent => {
                placeholder.innerHTML = htmlContent;
                initHeaderLogic();
            })
            .catch(error => {
                console.error('Ошибка интеграции компонента шапки:', error);
            });
    }
});

function initHeaderLogic() {
    
    function updateActiveLinks() {
        let currentPath = window.location.pathname.split('/').pop() || 'Main.html';
        let currentHash = window.location.hash;

        document.querySelectorAll('.nav-panel a').forEach(el => el.classList.remove('active'));

        let activeId = 'nav-index'; 

        if (currentPath === 'about.html') {
            activeId = 'nav-team';
        } else if (currentPath === 'details.html') {
            activeId = 'nav-developments';
        } else if (currentPath === 'Main.html' || currentPath === '') {
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

    updateActiveLinks();
    window.addEventListener('hashchange', updateActiveLinks);

    const burgerBtn = document.getElementById('burgerBtn');
    const navPanel = document.getElementById('navPanel');

    if (burgerBtn && navPanel) {
        
        burgerBtn.addEventListener('click', (event) => {
            event.stopPropagation(); 
            burgerBtn.classList.toggle('active'); 
            navPanel.classList.toggle('open');    
        });

        navPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                burgerBtn.classList.remove('active');
                navPanel.classList.remove('open');
            });
        });

        document.addEventListener('click', (event) => {
            if (!navPanel.contains(event.target) && !burgerBtn.contains(event.target)) {
                burgerBtn.classList.remove('active');
                navPanel.classList.remove('open');
            }
        });
    }
}
