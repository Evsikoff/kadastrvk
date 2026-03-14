import { MapParser } from '../utils/MapParser.js';
import { GameProgress } from '../utils/GameProgress.js';
import { VKBridge } from '../utils/VKBridge.js';

const GRID_SIZE = 8;

export class GameScene {
  constructor(app, el) {
    this.app        = app;
    this.el         = el;
    this.maps       = null;
    this.currentMapIndex = 0;
    this.currentMap = null;
    /** @type {Array<Array<{el:HTMLElement, row:number, col:number, type:number, houseEl:HTMLElement|null, xmarkEl:HTMLElement|null}>>} */
    this.grid       = [];
    this.houses     = []; // [{row, col, isHint}]
    this.blockedCells = new Set();
    this.hintCounter = 0;
    this.houseCount  = 0;
    this.isBuilding  = false;
    this.CELL_SIZE   = 62;
  }

  async show(data = {}) {
    if (!this.maps) {
      const res  = await fetch('/maps/kadastrmapsmall.txt');
      const text = await res.text();
      this.maps  = MapParser.parseMapFile(text);
    }

    const savedLevel = await GameProgress.loadLevel();
    const mapIndex   = data.mapIndex ?? savedLevel ?? 0;

    this._computeCellSize();
    this._renderLayout();
    await this._loadMap(mapIndex);

    this._resizeHandler = this._onResize.bind(this);
    window.addEventListener('resize', this._resizeHandler);
  }

  onHide() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }

  // ── Sizing ──────────────────────────────────────────────────────────────────

  _computeCellSize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const isMobile  = W <= 768;
    const isPortrait = H > W;

    let cellSize;
    if (isMobile && isPortrait) {
      const topBarH  = 72;
      const btnsH    = 56;
      const gridPad  = 28 * 2;
      const wrapPad  = 14 * 2 + 4 * 2;
      const availW   = W - 16;
      const availH   = H - topBarH - btnsH - 20;
      cellSize = Math.floor(Math.min(availW - wrapPad - gridPad, availH - wrapPad - gridPad) / GRID_SIZE);
    } else if (isMobile) {
      // Landscape mobile: small sidebars
      const sideW  = Math.floor(W * 0.18);
      const wrapPad = 14 * 2 + 4 * 2;
      const availW  = W - sideW * 2 - 16;
      const availH  = H - 12;
      cellSize = Math.floor(Math.min(availW - wrapPad, availH - wrapPad) / GRID_SIZE);
    } else {
      // Desktop
      const sideW   = Math.min(280, Math.floor(W * 0.20));
      const wrapPad = 14 * 2 + 4 * 2;
      const hdrH    = 80;
      const availW  = W - sideW * 2 - 32;
      const availH  = H - hdrH;
      cellSize = Math.floor(Math.min(availW - wrapPad, availH - wrapPad) / GRID_SIZE);
    }

    this.CELL_SIZE = Math.max(36, Math.min(cellSize, 110));
    document.documentElement.style.setProperty('--cell-size', `${this.CELL_SIZE}px`);
  }

  _onResize() {
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(() => {
      this._computeCellSize();
    }, 120);
  }

  // ── Layout rendering ────────────────────────────────────────────────────────

  _renderLayout() {
    const W        = window.innerWidth;
    const isMobile = W <= 768;

    this.el.innerHTML = `
      ${isMobile ? `
        <div style="display:flex;flex-direction:column;align-items:center;width:100%;height:100%;gap:6px;padding:8px;overflow:hidden;">
          <div class="game-top-bar" style="display:flex;">
            <div class="stat-chip">
              <span class="val" id="level-text">1/1</span>
              <span class="lbl">Уровень</span>
            </div>
            <div class="stat-chip">
              <span class="val" id="house-count">0/8</span>
              <span class="lbl">Дома</span>
            </div>
            <div class="spacer"></div>
            <button class="btn btn-sm btn-icon" id="hint-btn"  title="Подсказка">💡</button>
            <button class="btn btn-sm btn-icon btn-danger" id="clear-btn" title="Очистить">🗑️</button>
            <button class="btn btn-sm btn-icon btn-neutral" id="menu-btn" title="В меню">←</button>
          </div>
          <div class="grid-wrapper" id="grid-wrapper" style="flex-shrink:0;">
            <div class="game-grid" id="game-grid"></div>
          </div>
        </div>
      ` : `
        <div class="game-layout">
          <div class="game-sidebar game-sidebar-left">
            <div class="panel">
              <h3>ОБ ИГРЕ</h3>
              <ul>
                <li>На поле 8×8 есть участки 8 разных цветов</li>
                <li>В каждом ряду и столбце — по одному дому</li>
                <li>Дома не стоят в соседних ячейках (по диагонали тоже)</li>
                <li>В каждой зоне — ровно один дом</li>
              </ul>
            </div>
            <div class="stats-panel">
              <div class="stats-row">
                <div class="stat">
                  <span class="stat-label">Уровень</span>
                  <span class="stat-value" id="level-text">1/1</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Дома</span>
                  <span class="stat-value" id="house-count">0/8</span>
                </div>
              </div>
            </div>
            <button class="btn btn-sm" id="hint-btn">💡 Подсказка</button>
            <button class="btn btn-sm btn-danger" id="clear-btn">🗑️ Очистить</button>
            <button class="btn btn-sm btn-neutral" id="menu-btn">← Меню</button>
          </div>

          <div class="grid-wrapper" id="grid-wrapper">
            <div class="game-grid" id="game-grid"></div>
          </div>

          <div class="game-sidebar game-sidebar-right">
            <div class="panel">
              <h3>УПРАВЛЕНИЕ</h3>
              <ul>
                <li>Клик по ячейке — построить дом</li>
                <li>Клик по дому — снести дом</li>
                <li>Клик по «X» — подсветить блокировку</li>
                <li>💡 Подсказка — поставить правильный дом</li>
                <li>🗑️ Очистить — убрать все дома</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="game-header-title">
          <span class="title-sub">Игра</span>
          <span class="title-main">КАДАСТР</span>
        </div>
      `}
    `;

    this.el.querySelector('#hint-btn')?.addEventListener('click',  () => this.useHintWithAd());
    this.el.querySelector('#clear-btn')?.addEventListener('click', () => this.clearField());
    this.el.querySelector('#menu-btn')?.addEventListener('click',  () => this.app.startScene('menu', {}));
  }

  // ── Map loading ─────────────────────────────────────────────────────────────

  async _loadMap(index) {
    if (!this.maps || index >= this.maps.length) return;

    this.currentMapIndex = index;
    this.currentMap      = this.maps[index];
    this.hintCounter     = 0;
    this.houseCount      = 0;
    this.houses          = [];
    this.blockedCells    = new Set();
    this.isBuilding      = false;

    await GameProgress.saveLevel(index);
    this._updateUI();
    this._buildGrid();
  }

  // ── Grid construction ────────────────────────────────────────────────────────

  _buildGrid() {
    const gridEl = this.el.querySelector('#game-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';
    this.grid = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const type   = this.currentMap.regionMap[row][col];
        const cellEl = document.createElement('div');
        cellEl.className = `cell cell-${type}`;

        // Fence borders
        const regionMap = this.currentMap.regionMap;
        if (col < GRID_SIZE - 1 && regionMap[row][col + 1] !== type) cellEl.classList.add('fence-right');
        if (row < GRID_SIZE - 1 && regionMap[row + 1][col] !== type) cellEl.classList.add('fence-bottom');

        cellEl.addEventListener('click', () => this._onCellClick(row, col));
        gridEl.appendChild(cellEl);

        this.grid[row][col] = { el: cellEl, row, col, type, houseEl: null, xmarkEl: null };
      }
    }
  }

  // ── Game logic ───────────────────────────────────────────────────────────────

  _onCellClick(row, col) {
    if (this.isBuilding) return;

    const cell = this.grid[row][col];

    if (cell.houseEl) {
      this._removeHouse(row, col);
      return;
    }

    if (this.blockedCells.has(`${row},${col}`)) {
      this._highlightBlockedMarks(row, col);
      return;
    }

    this._buildHouse(row, col, false);
  }

  _buildHouse(row, col, isHint = false) {
    this.isBuilding = true;
    const cell = this.grid[row][col];

    const houseEl = document.createElement('div');
    houseEl.className = `house${isHint ? ' hint' : ''}`;
    houseEl.textContent = '🏠';
    houseEl.dataset.hint = isHint ? '1' : '0';

    cell.el.appendChild(houseEl);
    cell.houseEl = houseEl;

    this.houses.push({ row, col, isHint });
    this.houseCount++;
    this._updateUI();

    setTimeout(() => {
      this._addBlockedCells(row, col);
      this.isBuilding = false;
    }, 620);
  }

  _removeHouse(row, col) {
    const cell = this.grid[row][col];
    if (cell.houseEl) {
      cell.houseEl.remove();
      cell.houseEl = null;
    }
    this.houses = this.houses.filter(h => !(h.row === row && h.col === col));
    this.houseCount--;
    this._updateUI();
    this._recalculateBlockedCells();
  }

  _addBlockedCells(row, col) {
    const cell    = this.grid[row][col];
    const blocked = new Set();

    // 8-directional neighbours
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) blocked.add(`${nr},${nc}`);
      }
    }

    // Entire row & column
    for (let c = 0; c < GRID_SIZE; c++) blocked.add(`${row},${c}`);
    for (let r = 0; r < GRID_SIZE; r++) blocked.add(`${r},${col}`);

    // Same colour region
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c].type === cell.type) blocked.add(`${r},${c}`);
      }
    }

    blocked.forEach(pos => {
      const [r, c] = pos.split(',').map(Number);
      const target = this.grid[r][c];
      if (target.houseEl) return;

      this.blockedCells.add(pos);

      if (!target.xmarkEl) {
        const xmark = document.createElement('div');
        xmark.className = 'xmark';
        xmark.textContent = '✕';
        xmark.style.setProperty('--xmark-rot',   `${Math.floor(Math.random() * 320 + 20)}deg`);
        xmark.style.setProperty('--xmark-delay', `${(Math.random() * 0.35).toFixed(2)}s`);
        xmark.addEventListener('click', e => {
          e.stopPropagation();
          this._highlightBlockedMarks(r, c);
        });
        target.el.appendChild(xmark);
        target.xmarkEl = xmark;
      }
    });

    if (this.houseCount >= GRID_SIZE) {
      setTimeout(() => this._showVictory(), 900);
    }
  }

  _recalculateBlockedCells() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid[r][c];
        if (cell.xmarkEl) {
          cell.xmarkEl.remove();
          cell.xmarkEl = null;
        }
      }
    }
    this.blockedCells.clear();
    this.houses.forEach(({ row, col }) => this._addBlockedCells(row, col));
  }

  _findHouseBlockingCell(targetRow, targetCol) {
    for (const { row, col } of this.houses) {
      if (row === targetRow) return { row, col };
      if (col === targetCol) return { row, col };
      if (this.grid[row][col].type === this.grid[targetRow][targetCol].type) return { row, col };
      if (Math.abs(row - targetRow) <= 1 && Math.abs(col - targetCol) <= 1) return { row, col };
    }
    return null;
  }

  _getBlockedPositionsForHouse(hrow, hcol) {
    const blocked = new Set();
    const type    = this.grid[hrow][hcol].type;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = hrow + dr, nc = hcol + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) blocked.add(`${nr},${nc}`);
      }
    }
    for (let c = 0; c < GRID_SIZE; c++) blocked.add(`${hrow},${c}`);
    for (let r = 0; r < GRID_SIZE; r++) blocked.add(`${r},${hcol}`);
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c].type === type) blocked.add(`${r},${c}`);
      }
    }
    return blocked;
  }

  _highlightBlockedMarks(targetRow, targetCol) {
    const houseCell = this._findHouseBlockingCell(targetRow, targetCol);
    if (!houseCell) return;

    const blocked   = this._getBlockedPositionsForHouse(houseCell.row, houseCell.col);
    const toReset   = [];

    blocked.forEach(pos => {
      const [r, c] = pos.split(',').map(Number);
      const cell   = this.grid[r][c];
      if (cell.xmarkEl) {
        cell.xmarkEl.classList.add('highlight');
        toReset.push(cell.xmarkEl);
      }
    });

    const houseCell2 = this.grid[houseCell.row][houseCell.col];
    if (houseCell2.houseEl) {
      houseCell2.houseEl.classList.add('yellow');
      setTimeout(() => houseCell2.houseEl?.classList.remove('yellow'), 500);
    }

    setTimeout(() => toReset.forEach(x => x.classList.remove('highlight')), 500);
  }

  // ── Hint ─────────────────────────────────────────────────────────────────────

  async useHintWithAd() {
    this._showSpinner();
    const adShown = await VKBridge.showRewardAd();
    this._hideSpinner();
    if (adShown) this.useHint();
  }

  useHint() {
    if (this.hintCounter >= GRID_SIZE) return;

    const row  = this.hintCounter;
    const col  = this.currentMap.aCode[this.hintCounter];
    const cell = this.grid[row][col];

    if (!cell.houseEl && !this.blockedCells.has(`${row},${col}`)) {
      this._buildHouse(row, col, true);
      this.hintCounter++;
      return;
    }

    if (this.blockedCells.has(`${row},${col}`) && !cell.houseEl) {
      const blocking = this._findHouseBlockingCell(row, col);
      if (blocking) this._removeHouse(blocking.row, blocking.col);
      this._buildHouse(row, col, true);
      this.hintCounter++;
      return;
    }

    if (cell.houseEl) {
      this.hintCounter++;
      this.useHint();
    }
  }

  // ── Clear ────────────────────────────────────────────────────────────────────

  async clearField() {
    this._showSpinner();
    await VKBridge.showInterstitialAd();
    this._hideSpinner();

    [...this.houses].forEach(({ row, col }) => {
      const cell = this.grid[row][col];
      if (cell.houseEl) { cell.houseEl.remove(); cell.houseEl = null; }
    });
    this.houses     = [];
    this.houseCount = 0;
    this._updateUI();
    this._recalculateBlockedCells();
  }

  // ── Victory ──────────────────────────────────────────────────────────────────

  _showVictory() {
    // Save max level
    GameProgress.saveMaxLevel(this.currentMapIndex);

    // Fireworks overlay
    const fwEl = document.createElement('div');
    fwEl.id = 'victory-fireworks';
    fwEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:500;overflow:hidden;';
    document.body.appendChild(fwEl);

    const colors  = ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF'];
    const launch  = () => {
      const x     = 8 + Math.random() * 84;
      const y     = 5 + Math.random() * 48;
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 28; i++) {
        const p     = document.createElement('div');
        p.className = 'firework-particle';
        const angle = (i / 28) * Math.PI * 2;
        const dist  = 60 + Math.random() * 100;
        p.style.cssText = `left:${x}%;top:${y}%;background:${color};` +
          `--dx:${(Math.cos(angle) * dist).toFixed(1)}px;` +
          `--dy:${(Math.sin(angle) * dist).toFixed(1)}px;` +
          `--fw-delay:${(Math.random() * 0.15).toFixed(2)}s;`;
        fwEl.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    };

    launch(); launch(); launch();
    const fwInterval = setInterval(launch, 800);

    const isLastLevel = this.currentMapIndex >= (this.maps?.length ?? 1) - 1;

    setTimeout(() => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '600';
      overlay.innerHTML = `
        <div class="modal" style="border-color:#FFD700;text-align:center;">
          <h2 style="color:#9B2226;font-size:clamp(22px,3vw,30px);">🎉 Уровень пройден!</h2>
          <p style="font-size:clamp(15px,2vw,19px);color:#2F4858;">
            Уровень ${this.currentMapIndex + 1} завершён!
          </p>
          <div class="modal-buttons">
            ${!isLastLevel
              ? `<button class="btn btn-success" id="next-level-btn">Следующий уровень</button>`
              : ''}
            <button class="btn" id="back-menu-btn">В меню</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#next-level-btn')?.addEventListener('click', async () => {
        clearInterval(fwInterval);
        fwEl.remove();
        overlay.remove();
        const next = this.currentMapIndex + 1;
        await GameProgress.saveMaxLevel(next);
        this.app.startScene('game', { mapIndex: next });
      });

      overlay.querySelector('#back-menu-btn')?.addEventListener('click', () => {
        clearInterval(fwInterval);
        fwEl.remove();
        overlay.remove();
        if (isLastLevel) {
          GameProgress.clearProgress();
          this.app.startScene('win', {});
        } else {
          this.app.startScene('menu', {});
        }
      });
    }, 500);
  }

  // ── UI helpers ───────────────────────────────────────────────────────────────

  _updateUI() {
    const levelEl = this.el.querySelector('#level-text');
    if (levelEl) levelEl.textContent = `${this.currentMapIndex + 1}/${this.maps?.length ?? 1}`;

    const housesEl = this.el.querySelector('#house-count');
    if (housesEl) housesEl.textContent = `${this.houseCount}/8`;
  }

  _showSpinner() {
    if (document.getElementById('game-spinner')) return;
    const div = document.createElement('div');
    div.id = 'game-spinner';
    div.innerHTML = `<div class="spinner-ring-small"></div>`;
    document.body.appendChild(div);
  }

  _hideSpinner() {
    document.getElementById('game-spinner')?.remove();
  }
}
