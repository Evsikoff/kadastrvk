import { GameProgress } from '../utils/GameProgress.js';
import { MapParser } from '../utils/MapParser.js';

export class MenuScene {
  constructor(app, el) {
    this.app  = app;
    this.el   = el;
    this.maps = [];
  }

  async show(data) {
    if (!this.maps.length) {
      const res  = await fetch('/maps/kadastrmapsmall.txt');
      const text = await res.text();
      this.maps  = MapParser.parseMapFile(text);
    }
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="menu-layout">
        <div class="menu-buttons" style="margin-top:-40px;">
          <button class="btn" id="btn-continue">Продолжить игру</button>
          <button class="btn" id="btn-new">Новая игра</button>
          <button class="btn" id="btn-levels">Выбрать уровень</button>
          <button class="btn" id="btn-rules">Правила игры</button>
        </div>
      </div>
      <div class="menu-title">
        <span class="menu-title-sub">Игра</span>
        <span class="menu-title-main">КАДАСТР</span>
      </div>
    `;

    this.el.querySelector('#btn-continue').onclick = () => this.continueGame();
    this.el.querySelector('#btn-new').onclick      = () => this.showNewGameConfirm();
    this.el.querySelector('#btn-levels').onclick   = () => this.showLevelSelect();
    this.el.querySelector('#btn-rules').onclick    = () => this.showRulesModal();
  }

  async continueGame() {
    const level = await GameProgress.loadLevel() ?? 0;
    this.app.startScene('game', { mapIndex: level });
  }

  showNewGameConfirm() {
    const overlay = this._createOverlay(`
      <div class="modal" style="border-color:#B56576;">
        <h2>Новая игра?</h2>
        <p style="text-align:center;">
          При запуске игры заново, сохранение вашего игрового процесса будет потеряно.<br><br>
          Вы уверены, что хотите начать новую игру?
        </p>
        <div class="modal-buttons">
          <button class="btn btn-danger" id="confirm-yes">Да</button>
          <button class="btn" id="confirm-no">Нет</button>
        </div>
      </div>
    `);

    overlay.querySelector('#confirm-yes').onclick = async () => {
      overlay.remove();
      await GameProgress.clearProgress();
      this.app.startScene('game', { mapIndex: 0 });
    };
    overlay.querySelector('#confirm-no').onclick = () => overlay.remove();
  }

  async showLevelSelect() {
    const maxLevel    = await GameProgress.getMaxLevel() ?? 0;
    const totalLevels = Math.min(this.maps.length, 100);

    let tilesHtml = '';
    for (let i = 0; i < totalLevels; i++) {
      const avail = i <= maxLevel;
      tilesHtml += `<div class="level-tile ${avail ? 'available' : 'locked'}" data-level="${i}">${i + 1}</div>`;
    }

    const overlay = this._createOverlay(`
      <div class="modal" style="border-color:#3A7CA5;max-width:min(900px,calc(100vw - 32px));">
        <button class="modal-close">×</button>
        <h2 style="color:#1B4965;">Выбрать уровень</h2>
        <div class="level-grid">${tilesHtml}</div>
      </div>
    `);

    overlay.querySelector('.modal-close').onclick = () => overlay.remove();
    overlay.querySelectorAll('.level-tile.available').forEach(tile => {
      tile.onclick = () => {
        overlay.remove();
        this.app.startScene('game', { mapIndex: parseInt(tile.dataset.level) });
      };
    });
  }

  showRulesModal() {
    const overlay = this._createOverlay(`
      <div class="modal" style="border-color:#B56576;">
        <button class="modal-close">×</button>
        <h2 style="color:#9B2226;">Правила игры</h2>
        <p><strong>ОБ ИГРЕ:</strong><br>
        Вы — работник кадастровой фирмы в выдуманном государстве. Ваша задача — спроектировать размещение 8 домов на участках коттеджного поселка.</p>
        <p><strong>ПРАВИЛА:</strong></p>
        <ul>
          <li>На поле 8×8 есть участки 8 разных цветов</li>
          <li>В каждом ряду и столбце должно быть по одному дому</li>
          <li>Дома не могут стоять в соседних клетках (даже по диагонали)</li>
          <li>В каждой цветовой зоне должен быть ровно один дом</li>
        </ul>
        <p><strong>УПРАВЛЕНИЕ:</strong></p>
        <ul>
          <li>Клик по пустой ячейке — построить дом</li>
          <li>Клик по дому — снести дом</li>
          <li>Клик по «X» — показывает, какой дом блокирует эту ячейку</li>
          <li>Кнопка «Подсказка» — автоматически строит правильный дом</li>
        </ul>
        <p>Символы «X» показывают ячейки, заблокированные построенными домами. При клике на «X» все связанные метки подсвечиваются жёлтым.</p>
      </div>
    `);

    overlay.querySelector('.modal-close').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  _createOverlay(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    return overlay;
  }
}
