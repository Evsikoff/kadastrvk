import './style.css';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { WinScene } from './scenes/WinScene.js';
import { VKBridge } from './utils/VKBridge.js';

class App {
  constructor() {
    this.scenes = {};
    this.currentScene = null;
  }

  async init() {
    await VKBridge.init();
    await VKBridge.preloadRewardAd();

    // Build screen containers
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <div id="screen-menu"  class="screen"></div>
      <div id="screen-game"  class="screen"></div>
      <div id="screen-win"   class="screen"></div>
    `;

    this.scenes.menu = new MenuScene(this, document.getElementById('screen-menu'));
    this.scenes.game = new GameScene(this, document.getElementById('screen-game'));
    this.scenes.win  = new WinScene (this, document.getElementById('screen-win'));

    this.startScene('menu', {});

    // Hide loading screen
    const loading = document.getElementById('loading-screen');
    if (loading) {
      setTimeout(() => {
        loading.classList.add('hidden');
        setTimeout(() => loading.remove(), 500);
      }, 400);
    }
  }

  startScene(name, data = {}) {
    if (this.currentScene) {
      this.currentScene.el.classList.remove('active');
      this.currentScene.onHide?.();
    }
    this.currentScene = this.scenes[name];
    this.currentScene.show(data);
    this.currentScene.el.classList.add('active');
  }
}

window.addEventListener('contextmenu', e => e.preventDefault());

const app = new App();
app.init();
