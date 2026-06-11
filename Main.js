// ════════════════════════════════════════════
// МОБИЛЬНЫЙ СЛАЙДЕР HERO (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ)
// ════════════════════════════════════════════

function initMobileHeroSlider() {
    const isMobile = window.innerWidth <= 480;

    const wrapper = document.querySelector('.features-wrapper');
    if (!wrapper) return;

    // Удаляем старый слайдер, если он есть
    const oldSlider = document.getElementById('mobileHeroSlider');
    if (oldSlider) oldSlider.remove();

    // Если не мобильный — выходим
    if (!isMobile) return;

    const box1 = document.querySelector('.box-1');
    const box2 = document.querySelector('.box-2');

    if (!box1 && !box2) return;

    // Создаём контейнер
    const slider = document.createElement('div');
    slider.id = 'mobileHeroSlider';
    slider.className = 'mobile-slider-container';

    // Трек
    const track = document.createElement('div');
    track.className = 'mobile-slider-track';

    // Контент слайдов
    const slides = [box1?.innerHTML, box2?.innerHTML].filter(Boolean);

    slides.forEach(content => {
        const slide = document.createElement('div');
        slide.className = 'mobile-slide';

        const box = document.createElement('div');
        box.className = 'feature-box';
        box.innerHTML = content;

        slide.appendChild(box);
        track.appendChild(slide);
    });

    slider.appendChild(track);

    // Точки
    const dots = document.createElement('div');
    dots.className = 'mobile-slider-dots';

    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'mobile-dot' + (i === 0 ? ' active' : '');
        dot.dataset.index = i;
        dots.appendChild(dot);
    });

    slider.appendChild(dots);

    // Вставляем после вертикальной линии
    const vline = wrapper.querySelector('.vertical-line');
    if (vline) {
        wrapper.insertBefore(slider, vline.nextSibling);
    } else {
        wrapper.appendChild(slider);
    }

    // ════════════════════════════════════════
    // ЛОГИКА СЛАЙДЕРА
    // ════════════════════════════════════════

    let current = 0;
    const total = slides.length;

    const updateSlider = () => {
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.querySelectorAll('.mobile-dot').forEach((d, i) => {
            d.classList.toggle('active', i === current);
        });
    };

    // Клик по точкам
    dots.addEventListener('click', e => {
        if (e.target.classList.contains('mobile-dot')) {
            current = Number(e.target.dataset.index);
            updateSlider();
        }
    });

    // Свайп
    let startX = 0;
    let deltaX = 0;

    track.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
    });

    track.addEventListener('touchmove', e => {
        deltaX = e.touches[0].clientX - startX;
    });

    track.addEventListener('touchend', () => {
        if (Math.abs(deltaX) > 50) {
            if (deltaX < 0 && current < total - 1) current++;
            if (deltaX > 0 && current > 0) current--;
        }
        updateSlider();
        deltaX = 0;
    });

    updateSlider();
}

// Инициализация
window.addEventListener('load', initMobileHeroSlider);
window.addEventListener('resize', initMobileHeroSlider);


// ════════════════════════════════════════════
// ОСНОВНОЙ КОД СТРАНИЦЫ
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
 
    // ❗ ВАЖНО: Инициализация мобильного слайдера ПЕРВОЙ
    (function() {
    if (typeof initMobileHeroSlider === 'function') {
        initMobileHeroSlider();
    }

    const sliderContainer = document.getElementById('exp-slider-container');
    const dotsContainer   = document.getElementById('exp-dots-container');
    const prevBtn         = document.getElementById('exp-prev-btn');
    const nextBtn         = document.getElementById('exp-next-btn');

    if (!sliderContainer || !dotsContainer || !prevBtn || !nextBtn) return;

    let sensorsData  = [];
    let currentIndex = 0;

    // Логика: если экран меньше или равен 1024px (планшеты и мобилки) — выводим по 1 карточке. На десктопе — по 2.
    function getCardsToShowCount() {
        return window.innerWidth <= 1024 ? 1 : 2;
    }

    fetch('db.json')
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки БД');
            return response.json();
        })
        .then(data => {
            sensorsData = data.sensors || [];
            updateSlider();
            
            if (typeof initReviews === 'function') {
                initReviews(data.reviews || []);
            }
        })
        .catch(error => {
            console.error(error);
            sliderContainer.innerHTML = '<p style="color:#004A8F; text-align:center; grid-column: 1/-1;">Не удалось загрузить данные.</p>';
        });

    function renderCards() {
        sliderContainer.innerHTML = '';
        const cardsToShow = getCardsToShowCount();
        
        sensorsData.slice(currentIndex, currentIndex + cardsToShow).forEach(sensor => {
            const card = document.createElement('div');
            card.className = 'exp-sensor-card';
            const fallbackImage = `https://via.placeholder.com/430x250/004A8F/FFFFFF?text=${encodeURIComponent(sensor.title)}`;
            
            card.innerHTML = `
                <img src="${sensor.image}" onerror="this.src='${fallbackImage}'" alt="${sensor.title}">
                <div class="exp-sensor-info">
                    <div class="exp-sensor-title">${sensor.title}</div>
                    <div class="exp-sensor-company">${sensor.company}</div>
                </div>`;
                
            sliderContainer.appendChild(card);
        });
    }

    function renderDots() {
        dotsContainer.innerHTML = '';
        const cardsToShow = getCardsToShowCount();
        const maxIndex = sensorsData.length - cardsToShow;
        
        if (maxIndex < 0) return;

        for (let i = 0; i <= maxIndex; i++) {
            const dot = document.createElement('span');
            dot.className = `exp-dot ${i === currentIndex ? 'active' : ''}`;
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

    window.addEventListener('resize', () => {
        updateSlider();
    });
})();
 
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
