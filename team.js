(function () {
  'use strict';
 
  const DB_URL = '/db.json';          
  const CARDS_PER_PAGE = 4;          
 
 
  function nl2br(str) {
    return str.replace(/\n/g, '<br>');
  }
 
 
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
 
 
  class MembersCarousel {
    /**
     * @param {HTMLElement} grid     
     * @param {HTMLElement} btnPrev  
     * @param {HTMLElement} btnNext  
     * @param {Array}       members  
     */
    constructor(grid, btnPrev, btnNext, members) {
      this.grid     = grid;
      this.btnPrev  = btnPrev;
      this.btnNext  = btnNext;
      this.members  = members;
      this.offset   = 0;            
 
      this._render();
      this._updateButtons();
 
      btnPrev.addEventListener('click', () => this._prev());
      btnNext.addEventListener('click', () => this._next());
    }
 
    _render() {
      const visible = this.members.slice(this.offset, this.offset + CARDS_PER_PAGE);
      this.grid.innerHTML = visible.map(createMemberCard).join('');
    }
 
    _updateButtons() {
      this.btnPrev.disabled = this.offset === 0;
      this.btnPrev.style.opacity = this.offset === 0 ? '0.3' : '1';
 
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
 
 
  function buildSection(section, teamData) {
    let leadersGrid     = section.querySelector('.leaders-grid');
    let carouselWrapper = section.querySelector('.carousel-wrapper');
    let membersGrid     = section.querySelector('.members-grid');
    let btnPrev         = section.querySelector('.carousel-arrow[aria-label="Назад"]');
    let btnNext         = section.querySelector('.carousel-arrow[aria-label="Вперед"]');
 
    if (leadersGrid) {
      leadersGrid.innerHTML = '';
    }
    if (membersGrid) {
      membersGrid.innerHTML = '';
    }
 
    if (teamData.leaders && teamData.leaders.length > 0) {
      leadersGrid.innerHTML = teamData.leaders.map(createLeaderCard).join('');
    }
 
    if (teamData.members && teamData.members.length > 0 && membersGrid && btnPrev && btnNext) {
      new MembersCarousel(membersGrid, btnPrev, btnNext, teamData.members);
    }
  }
 
 
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
 
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
