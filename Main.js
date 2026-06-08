document.addEventListener('DOMContentLoaded', () => {
    // --- КОД ВАШЕГО СЛАЙДЕРА (БЕЗ ИЗМЕНЕНИЙ) ---
    const sliderContainer = document.getElementById('slider-container');
    const dotsContainer = document.getElementById('dots-container');
    const prevBtn = document.getElementById('prev-btn');
    const $nextBtn = document.getElementById('next-btn'); 
    const nextBtn = $nextBtn; 
    
    let sensorsData = [];
    let currentIndex = 0;
    const cardsToShow = 2; 

    // 1. Загружаем данные из json.db
    fetch('db.json')
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки БД');
            return response.json();
        })
        .then(data => {
            sensorsData = data.sensors;
            updateSlider(); 
        })
        .catch(error => {
            console.error(error);
            sliderContainer.innerHTML = '<p style="color: white;">Не удалось загрузить данные.</p>';
        });

    // 2. Функция рендера карточек
    function renderCards() {
        sliderContainer.innerHTML = ''; 
        
        const visibleCards = sensorsData.slice(currentIndex, currentIndex + cardsToShow);
        
        visibleCards.forEach(sensor => {
            const card = document.createElement('div');
            card.className = 'sensor-card';
            
            const fallbackImage = `https://via.placeholder.com/430x250/004A8F/FFFFFF?text=${sensor.title}`;
            
            card.innerHTML = `
                <img src="${sensor.image}" onerror="this.src='${fallbackImage}'" alt="${sensor.title}">
                <div class="sensor-info">
                    <div class="sensor-title">${sensor.title}</div>
                    <div class="sensor-company">${sensor.company}</div>
                </div>
            `;
            
            const imgEl = card.querySelector('img');
            const infoEl = card.querySelector('.sensor-info');
            
            imgEl.addEventListener('click', () => {
                infoEl.classList.toggle('active');
            });
            
            sliderContainer.appendChild(card);
        });
    }

    // 3. Функция рендера точек
    function renderDots() {
        dotsContainer.innerHTML = '';
        const maxIndex = sensorsData.length - cardsToShow;
        
        for (let i = 0; i <= maxIndex; i++) {
            const dot = document.createElement('span');
            dot.className = `dot ${i === currentIndex ? 'active' : ''}`;
            dotsContainer.appendChild(dot);
        }
    }

    // 4. Блокировка стрелок
    function updateArrows() {
        const maxIndex = sensorsData.length - cardsToShow;
        
        if (currentIndex === 0) {
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.classList.remove('disabled');
        }

        if (currentIndex >= maxIndex) {
            nextBtn.classList.add('disabled');
        } else {
            nextBtn.classList.remove('disabled');
        }
    }

    // Общая функция обновления слайдера
    function updateSlider() {
        renderCards();
        renderDots();
        updateArrows();
    }

    // 5. Обработчики кликов по стрелкам
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
        }
    });

    nextBtn.addEventListener('click', () => {
        const maxIndex = sensorsData.length - cardsToShow;
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateSlider();
        }
    });


    // --- НОВЫЙ БЛОК: СЛЕДИМ ЗА СКРОЛЛОМ (SCROLLSPY) ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-panel a');

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        
        // Смещение относительно шапки, чтобы переключение происходило вовремя
        const scrollPosition = window.scrollY + 130; 

        // Если пользователь прокрутил страницу до самого низа — сразу подсвечиваем «Новости»
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 25) {
            currentSectionId = sections[sections.length - 1].getAttribute('id');
        } else {
            // В противном случае проверяем, в зоне какой секции мы находимся
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (scrollPosition >= sectionTop) {
                    currentSectionId = section.getAttribute('id');
                }
            });
        }

        // Переключаем класс active у ссылок
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });
});
