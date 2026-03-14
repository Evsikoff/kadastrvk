import { GameProgress } from '../utils/GameProgress.js';

export class WinScene {
  constructor(app, el) {
    this.app        = app;
    this.el         = el;
    this.fwInterval = null;
  }

  show(data) {
    GameProgress.clearProgress();
    this._render();
    this._startFireworks();
  }

  onHide() {
    if (this.fwInterval) {
      clearInterval(this.fwInterval);
      this.fwInterval = null;
    }
  }

  _render() {
    this.el.innerHTML = `
      <div id="fireworks-container"></div>
      <div class="win-content">
        <h1 class="win-title">Поздравляем!</h1>
        <p class="win-subtitle">Вы прошли все уровни!</p>
        <button class="btn win-btn" id="restart-btn">Начать заново</button>
      </div>
    `;
    this.el.querySelector('#restart-btn').onclick = () => {
      this.app.startScene('game', { mapIndex: 0 });
    };
  }

  _startFireworks() {
    const container = this.el.querySelector('#fireworks-container');
    if (!container) return;

    const colors = ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF'];

    const launch = () => {
      const x     = 8 + Math.random() * 84;
      const y     = 5 + Math.random() * 48;
      const color = colors[Math.floor(Math.random() * colors.length)];

      for (let i = 0; i < 25; i++) {
        const p     = document.createElement('div');
        p.className = 'firework-particle';
        const angle = (i / 25) * Math.PI * 2;
        const dist  = 60 + Math.random() * 110;
        p.style.cssText =
          `left:${x}%;top:${y}%;background:${color};` +
          `--dx:${(Math.cos(angle) * dist).toFixed(1)}px;` +
          `--dy:${(Math.sin(angle) * dist).toFixed(1)}px;` +
          `--fw-delay:${(Math.random() * 0.12).toFixed(2)}s;`;
        container.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    };

    launch(); launch(); launch();
    this.fwInterval = setInterval(launch, 800);
  }
}
