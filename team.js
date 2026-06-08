(function () {
  'use strict';
 
  const DB_URL = '/db.json';          // путь к вашему json-server или статическому файлу
  const CARDS_PER_PAGE = 4;           // сколько карточек участников видно одновременно
 
  /* ─────────────────────────────────────────
     Утилиты
  ───────────────────────────────────────── */
 
  /** Заменяет \n на <br> для вывода в innerHTML */
  function nl2br(str) {
    return str.replace(/\n/g, '<br>');
  }
 
  /* ─────────────────────────────────────────
     Генераторы HTML
  ───────────────────────────────────────── */
 
  function createLeaderCard(person) {
    return `
      <div class="card leader">
        <div class="tag ${person.tagColor}">${person.tag}</div>
        <img class="avatar" src="${person.avatar}" alt="${person.lastName} ${person.firstName}">
        <div class="name-block">
          <div class="last-name">${person.lastName}</div>
          <div class="first-name">${person.firstName}</div>
        </div>
        <div class="description">${nl2br(person.description)}</div>
        <div class="expertise">${person.expertise}</div>
        <a href="${person.btnHref}" class="btn">${person.btnText}</a>
      </div>`;
  }
 
  function createMemberCard(person) {
    return `
      <div class="card member">
        <div class="tag ${person.tagColor}">${person.tag}</div>
        <img class="avatar" src="${person.avatar}" alt="${person.lastName} ${person.firstName}">
        <div class="name-block">
          <div class="last-name">${person.lastName}</div>
          <div class="first-name">${person.firstName}</div>
        </div>
        <div class="description">${nl2br(person.description)}</div>
        <div class="expertise">${person.expertise}</div>
        <a href="${person.btnHref}" class="btn">${person.btnText}</a>
      </div>`;
  }
 
  /* ─────────────────────────────────────────
     Карусель
  ───────────────────────────────────────── */
 
  class MembersCarousel {
    /**
     * @param {HTMLElement} grid     - контейнер .members-grid
     * @param {HTMLElement} btnPrev  - кнопка «назад»
     * @param {HTMLElement} btnNext  - кнопка «вперёд»
     * @param {Array}       members  - массив данных из db.json
     */
    constructor(grid, btnPrev, btnNext, members) {
      this.grid     = grid;
      this.btnPrev  = btnPrev;
      this.btnNext  = btnNext;
      this.members  = members;
      this.offset   = 0;            // индекс первой видимой карточки
 
      this._render();
      this._updateButtons();
 
      btnPrev.addEventListener('click', () => this._prev());
      btnNext.addEventListener('click', () => this._next());
    }
 
    _render() {
      // Показываем срез [offset, offset + CARDS_PER_PAGE)
      const visible = this.members.slice(this.offset, this.offset + CARDS_PER_PAGE);
      this.grid.innerHTML = visible.map(createMemberCard).join('');
    }
 
    _updateButtons() {
      // Стрелка «назад» недоступна в самом начале
      this.btnPrev.disabled = this.offset === 0;
      this.btnPrev.style.opacity = this.offset === 0 ? '0.3' : '1';
 
      // Стрелка «вперёд» недоступна, если дошли до конца
      const atEnd = this.offset + CARDS_PER_PAGE >= this.members.length;
      this.btnNext.disabled = atEnd;
      this.btnNext.style.opacity = atEnd ? '0.3' : '1';
    }
 
    _prev() {
      if (this.offset > 0) {
        this.offset = Math.max(0, this.offset - CARDS_PER_PAGE);
        this._render();
        this._updateButtons();
      }
    }
 
    _next() {
      if (this.offset + CARDS_PER_PAGE < this.members.length) {
        this.offset += CARDS_PER_PAGE;
        this._render();
        this._updateButtons();
      }
    }
  }
 
  /* ─────────────────────────────────────────
     Инициализация секции
  ───────────────────────────────────────── */
 
  function buildSection(section, teamData) {
    // Находим или создаём подразделы внутри секции
    let leadersGrid     = section.querySelector('.leaders-grid');
    let carouselWrapper = section.querySelector('.carousel-wrapper');
    let membersGrid     = section.querySelector('.members-grid');
    let btnPrev         = section.querySelector('.carousel-arrow[aria-label="Назад"]');
    let btnNext         = section.querySelector('.carousel-arrow[aria-label="Вперед"]');
 
    // Если блоки уже есть в HTML — очищаем только сетки
    // (заголовок и стрелки оставляем нетронутыми)
    if (leadersGrid) {
      leadersGrid.innerHTML = '';
    }
    if (membersGrid) {
      membersGrid.innerHTML = '';
    }
 
    // ── Руководители ──
    if (teamData.leaders && teamData.leaders.length > 0) {
      leadersGrid.innerHTML = teamData.leaders.map(createLeaderCard).join('');
    }
 
    // ── Участники с каруселью ──
    if (teamData.members && teamData.members.length > 0 && membersGrid && btnPrev && btnNext) {
      new MembersCarousel(membersGrid, btnPrev, btnNext, teamData.members);
    }
  }
 
  /* ─────────────────────────────────────────
     Загрузка данных и точка входа
  ───────────────────────────────────────── */
 
  async function init() {
    const section = document.getElementById('developers');
    if (!section) {
      console.warn('[team.js] Секция #developers не найдена.');
      return;
    }
 
    try {
      const response = await fetch(DB_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const db = await response.json();
 
      if (!db.team) {
        console.warn('[team.js] В db.json нет ключа "team".');
        return;
      }
 
      buildSection(section, db.team);
    } catch (err) {
      console.error('[team.js] Ошибка загрузки db.json:', err);
    }
  }
 
  // Запускаем после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
