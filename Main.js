// ════════════════════════════════════════════
// МОБИЛЬНЫЙ СЛАЙДЕР ДЛЯ HERO-СЕКЦИИ (ИСПРАВЛЕННАЯ ВЕРСИЯ)
// ════════════════════════════════════════════
function initMobileHeroSlider() {
    // Принудительно проверяем ширину экрана
    const isMobile = window.innerWidth <= 480;
    
    const featuresWrapper = document.querySelector('.features-wrapper');
    if (!featuresWrapper) {
        console.warn('[MobileHeroSlider] .features-wrapper не найден');
        return;
    }

    // Удаляем существующий слайдер (если есть)
    const existingSlider = document.getElementById('mobileHeroSlider');
    if (existingSlider) {
        existingSlider.remove();
    }

    // Если не мобильный — выходим
    if (!isMobile) {
        return;
    }

    // Получаем текстовые блоки
    const box1 = document.querySelector('.box-1');
    const box2 = document.querySelector('.box-2');
    
    if (!box1 && !box2) {
        console.warn('[MobileHeroSlider] Текстовые блоки не найдены');
        return;
    }

    console.log('[MobileHeroSlider] Создаём мобильный слайдер...');

    // === Создаём контейнер слайдера ===
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'mobile-slider-container';
    sliderContainer.id = 'mobileHeroSlider';
    sliderContainer.style.cssText = 'display:block !important; width:100%; position:relative; overflow:hidden; margin-top:10px;';

    // === Создаём трек ===
    const sliderTrack = document.createElement('div');
    sliderTrack.className = 'mobile-slider-track';
    sliderTrack.style.cssText = 'display:flex !important; transition:transform 0.3s ease-in-out; touch-action:pan-y;';

    // === Собираем слайды ===
    const slidesContent = [];
    if (box1) slidesContent.push(box1.innerHTML);
    if (box2) slidesContent.push(box2.innerHTML);

    slidesContent.forEach((content) => {
        const slide = document.createElement('div');
        slide.className = 'mobile-slide';
        slide.style.cssText = 'min-width:100%; flex:0 0 100%; box-sizing:border-box;';
        
        const featureBox = document.createElement('div');
        featureBox.className = 'feature-box';
        featureBox.innerHTML = content;
        
        slide.appendChild(featureBox);
        sliderTrack.appendChild(slide);
    });

    sliderContainer.appendChild(sliderTrack);

    // === Создаём точки навигации ===
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'mobile-slider-dots';
    dotsContainer.style.cssText = 'display:flex !important; justify-content:center; gap:8px; margin-top:15px;';
    
    slidesContent.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'mobile-dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('data-index', index);
        dot.setAttribute('aria-label', `Слайд ${index + 1}`);
        dot.type = 'button';
        dotsContainer.appendChild(dot);
    });
    
    sliderContainer.appendChild(dotsContainer);

    // === Вставляем слайдер в DOM (после вертикальной линии, если есть) ===
    const verticalLine = featuresWrapper.querySelector('.vertical-line');
    if (verticalLine && verticalLine.parentNode === featuresWrapper) {
        featuresWrapper.insertBefore(sliderContainer, verticalLine.nextSibling);
    } else {
        featuresWrapper.appendChild(sliderContainer);
    }

    // ════════════════════════════════════════════
    // ЛОГИКА СЛАЙДЕРА
    // ════════════════════════════════════════════
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    const totalSlides = slidesContent.length;

    function updateSlider() {
        sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
        const dots = dotsContainer.querySelectorAll('.mobile-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // Клик по точкам
    dotsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('mobile-dot')) {
            currentIndex = parseInt(e.target.dataset.index, 10);
            updateSlider();
        }
    });

    // === Touch события для свайпа ===
    sliderTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        sliderTrack.style.transition = 'none';
    }, { passive: true });

    sliderTrack.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        const percentDiff = (diff / sliderTrack.offsetWidth) * 100;
        const translateX = -(currentIndex * 100) + percentDiff;
        sliderTrack.style.transform = `translateX(${translateX}%)`;
    }, { passive: true });

    sliderTrack.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        sliderTrack.style.transition = 'transform 0.3s ease-in-out';
        
        const diff = currentX - startX;
        const threshold = 50;

        if (diff > threshold && currentIndex > 0) {
            currentIndex--;
        } else if (diff < -threshold && currentIndex < totalSlides - 1) {
            currentIndex++;
        }

        updateSlider();
    });

    // === Автопрокрутка ===
    let autoPlayInterval = setInterval(() => {
        if (window.innerWidth <= 480) {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateSlider();
        }
    }, 5000);

    // Остановка автопрокрутки при касании
    sliderTrack.addEventListener('touchstart', () => {
        clearInterval(autoPlayInterval);
    });
    dotsContainer.addEventListener('click', () => {
        clearInterval(autoPlayInterval);
    });
}

// ════════════════════════════════════════════
// ОСНОВНОЙ КОД СТРАНИЦЫ
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
 
    // ❗ ВАЖНО: Инициализация мобильного слайдера ПЕРВОЙ
    initMobileHeroSlider();

    // ════════════════════════════════════════════
    // СЛАЙДЕР ДАТЧИКОВ
    // ════════════════════════════════════════════
    // ════════════════════════════════════════════
    // СЛАЙДЕР ДАТЧИКОВ (ОПЫТ ВНЕДРЕНИЯ) - АДАПТИРОВАННЫЙ
    // ════════════════════════════════════════════
    const sliderContainer = document.getElementById('slider-container');
    const dotsContainer   = document.getElementById('dots-container');
    const prevBtn         = document.getElementById('prev-btn');
    const nextBtn         = document.getElementById('next-btn');
 
    let sensorsData  = [];
    let currentIndex = 0;
    
    // Динамически определяем количество карточек на экране
    function getCardsToShowCount() {
        return window.innerWidth <= 1024 ? 1 : 2; // 1 на планшетах/мобилках, 2 на десктопе
    }
 
    fetch('db.json')
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки БД');
            return response.json();
        })
        .then(data => {
            sensorsData = data.sensors;
            updateSlider();
            initReviews(data.reviews || []);
        })
        .catch(error => {
            console.error(error);
            if (sliderContainer) {
                sliderContainer.innerHTML = '<p style="color:#004A8F;">Не удалось загрузить данные.</p>';
            }
        });
 
    function renderCards() {
        sliderContainer.innerHTML = '';
        const cardsToShow = getCardsToShowCount();
        
        sensorsData.slice(currentIndex, currentIndex + cardsToShow).forEach(sensor => {
            const card = document.createElement('div');
            card.className = 'sensor-card';
            const fallbackImage = `https://via.placeholder.com/430x250/004A8F/FFFFFF?text=${sensor.title}`;
            
            card.innerHTML = `
                <img src="${sensor.image}" onerror="this.src='${fallbackImage}'" alt="${sensor.title}">
                <div class="sensor-info">
                    <div class="sensor-title">${sensor.title}</div>
                    <div class="sensor-company">${sensor.company}</div>
                </div>`;
                
            sliderContainer.appendChild(card);
        });
    }
 
    function renderDots() {
        dotsContainer.innerHTML = '';
        const cardsToShow = getCardsToShowCount();
        const maxIndex = sensorsData.length - cardsToShow;
        
        // Если карточек меньше или столько же, сколько вмещается, точки не нужны
        if (maxIndex < 0) return;

        for (let i = 0; i <= maxIndex; i++) {
            const dot = document.createElement('span');
            dot.className = `dot ${i === currentIndex ? 'active' : ''}`;
            // Клик по точкам для удобства
            dot.addEventListener('click', () => {
                currentIndex = i;
                updateSlider();
            });
            dotsContainer.appendChild(dot);
        }
    }
 
    function updateArrows() {
        const cardsToShow = getCardsToShowCount();
        const maxIndex = sensorsData.length - cardsToShow;
        
        prevBtn.classList.toggle('disabled', currentIndex === 0);
        nextBtn.classList.toggle('disabled', currentIndex >= maxIndex);
    }
 
    function updateSlider() {
        // Корректируем индекс при изменении разрешения экрана
        const cardsToShow = getCardsToShowCount();
        if (currentIndex > sensorsData.length - cardsToShow) {
            currentIndex = Math.max(0, sensorsData.length - cardsToShow);
        }

        renderCards();
        renderDots();
        updateArrows();
    }
 
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; updateSlider(); }
    });
 
    nextBtn.addEventListener('click', () => {
        const cardsToShow = getCardsToShowCount();
        if (currentIndex < sensorsData.length - cardsToShow) { currentIndex++; updateSlider(); }
    });

    // Пересчитываем слайдер при изменении размеров окна
    window.addEventListener('resize', () => {
        updateSlider();
    });
 
    // ════════════════════════════════════════════
    // КАРУСЕЛЬ ОТЗЫВОВ
    // ════════════════════════════════════════════
    const REVIEWS_PER_PAGE = 3;
 
    function initReviews(reviews) {
        const track    = document.getElementById('reviews-track');
        const btnPrev  = document.getElementById('reviews-prev');
        const btnNext  = document.getElementById('reviews-next');
 
        if (!track || !btnPrev || !btnNext || reviews.length === 0) return;
 
        let offset = 0;
 
        function createReviewCard(review) {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <div class="review-product">${review.product}</div>
                <div class="review-company">${review.company}</div>
                <div class="review-author-name">${review.authorName}</div>
                <div class="review-author-role">${review.authorRole}</div>
                <div class="review-text">${review.text}</div>
                <div class="review-footer">
                    <div class="review-star"></div>
                    <div class="review-rating">${review.rating} — ${review.ratingLabel}</div>
                    <div class="review-date">${review.date}</div>
                </div>`;
            return card;
        }
 
        function render() {
            track.innerHTML = '';
            reviews
                .slice(offset, offset + REVIEWS_PER_PAGE)
                .forEach(r => track.appendChild(createReviewCard(r)));
        }
 
        function updateButtons() {
            btnPrev.disabled = offset === 0;
            btnNext.disabled = offset + REVIEWS_PER_PAGE >= reviews.length;
        }
 
        function go(direction) {
            offset = Math.max(0, Math.min(
                reviews.length - REVIEWS_PER_PAGE,
                offset + direction * REVIEWS_PER_PAGE
            ));
            render();
            updateButtons();
        }
 
        btnPrev.addEventListener('click', () => go(-1));
        btnNext.addEventListener('click', () => go(+1));
 
        render();
        updateButtons();
    }
 
    // ════════════════════════════════════════════
    // SCROLLSPY
    // ════════════════════════════════════════════
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-panel a');
 
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 130;
 
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 25) {
            currentSectionId = sections[sections.length - 1].getAttribute('id');
        } else {
            sections.forEach(section => {
                if (scrollPosition >= section.offsetTop) {
                    currentSectionId = section.getAttribute('id');
                }
            });
        }
 
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });
});

// ════════════════════════════════════════════
// ОБРАБОТЧИК РЕСАЙЗА (с debounce)
// ════════════════════════════════════════════
let heroResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(heroResizeTimer);
    heroResizeTimer = setTimeout(() => {
        initMobileHeroSlider();
    }, 250);
});

// ════════════════════════════════════════════
// ДОПОЛНИТЕЛЬНАЯ ГАРАНТИЯ: запуск через 500мс после загрузки
// (на случай если DOMContentLoaded сработал слишком рано)
// ════════════════════════════════════════════
window.addEventListener('load', () => {
    setTimeout(() => {
        initMobileHeroSlider();
    }, 300);
});
