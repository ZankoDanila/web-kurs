document.addEventListener('DOMContentLoaded', () => {

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    const sliderContainer = document.getElementById('exp-slider-container');
    const dotsContainer   = document.getElementById('exp-dots-container');
    const prevBtn         = document.getElementById('exp-prev-btn');
    const nextBtn         = document.getElementById('exp-next-btn');

    if (sliderContainer && dotsContainer && prevBtn && nextBtn) {
        let sensorsData = [];
        let currentIndex = 0;

        function getCardsToShowCount() {
            return window.innerWidth <= 1024 ? 1 : 2;
        }

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
        window.addEventListener('resize', () => updateSlider());

        fetch('db.json')
            .then(response => response.ok ? response.json() : Promise.reject('Ошибка загрузки БД'))
            .then(data => {
                sensorsData = data.sensors || [];
                updateSlider();
                initReviewsCarousel(data.public_reviews || []);
            })
            .catch(error => {
                console.error(error);
                if (sliderContainer) sliderContainer.innerHTML = '<p style="color:#004A8F; text-align:center;">Не удалось загрузить данные.</p>';
            });
    }

    function initReviewsCarousel(reviews) {
        const track = document.getElementById('reviews-track');
        const wrapper = track?.parentElement; 
        const btnPrev = document.getElementById('reviews-prev');
        const btnNext = document.getElementById('reviews-next');

        if (!track || !wrapper || !btnPrev || !btnNext) return;
        if (reviews.length === 0) {
            track.innerHTML = '<div class="review-card">Пока нет отзывов</div>';
            btnPrev.style.display = 'none';
            btnNext.style.display = 'none';
            return;
        }

        function createReviewCard(review) {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <div class="review-product">${escapeHtml(review.product)}</div>
                <div class="review-company">${escapeHtml(review.company)}</div>
                <div class="review-author-name">${escapeHtml(review.authorName)}</div>
                <div class="review-author-role">${escapeHtml(review.authorRole)}</div>
                <div class="review-text">${escapeHtml(review.text)}</div>
                <div class="review-footer">
                    <div class="review-star"></div>
                    <div class="review-rating">${escapeHtml(review.rating)} — ${escapeHtml(review.ratingLabel)}</div>
                    <div class="review-date">${escapeHtml(review.date)}</div>
                </div>`;
            return card;
        }

        track.innerHTML = '';
        reviews.forEach(r => track.appendChild(createReviewCard(r)));

        let currentIndex = 0;
        let visibleCards = 3;           
        let cardWidth = 400;            
        let gap = 16;                   
        let step = cardWidth + gap;     

        function updateDimensions() {
            const firstCard = track.querySelector('.review-card');
            if (firstCard) {
                cardWidth = firstCard.offsetWidth;
                step = cardWidth + gap;
            }
        }

        function getMaxTranslate() {
            const totalCards = reviews.length;
            const trackWidth = track.scrollWidth; 
            const wrapperWidth = wrapper.clientWidth;
            if (trackWidth <= wrapperWidth) return 0;
            return trackWidth - wrapperWidth;
        }

        function translateTo(index) {
            const max = getMaxTranslate();
            let newOffset = index * step;
            if (newOffset > max) newOffset = max;
            if (newOffset < 0) newOffset = 0;
            track.style.transform = `translateX(-${newOffset}px)`;
            currentIndex = Math.round(newOffset / step);
            updateButtons();
        }

        function updateButtons() {
            const max = getMaxTranslate();
            btnPrev.disabled = (currentIndex === 0);
            btnNext.disabled = (currentIndex * step >= max);
        }

        function go(delta) {
            let newIndex = currentIndex + delta;
            if (newIndex < 0) newIndex = 0;
            const maxIndex = Math.floor(getMaxTranslate() / step);
            if (newIndex > maxIndex) newIndex = maxIndex;
            if (newIndex !== currentIndex) {
                translateTo(newIndex);
            }
        }

        btnPrev.addEventListener('click', () => go(-1));
        btnNext.addEventListener('click', () => go(1));

        window.addEventListener('resize', () => {
            setTimeout(() => {
                updateDimensions();
                translateTo(currentIndex);
                updateButtons();
            }, 100);
        });

        setTimeout(() => {
            updateDimensions();
            translateTo(0);
        }, 50);
    }

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-panel a');
    if (sections.length && navLinks.length) {
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
    }
});
