import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import WinScene from './scenes/WinScene.js';
import { VKBridge } from './utils/VKBridge.js';
import { ContainerDetector } from './utils/ContainerDetector.js';

const isMobileDevice = /android|iphone|ipad|ipod|windows phone|mobile/i.test(
  navigator.userAgent ?? ''
);

/**
 * Получает размеры контейнера game-container
 */
const getContainerSize = () => {
  const container = document.getElementById('game-container');
  if (container && container.clientWidth > 0 && container.clientHeight > 0) {
    return {
      width: container.clientWidth,
      height: container.clientHeight
    };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

/**
 * Определяет размер игры — всегда равен размерам контейнера.
 * Это гарантирует 1:1 соответствие между игровыми пикселями и CSS-пикселями,
 * исключая искажения пропорций и проблемы с читаемостью текста.
 */
const getGameSize = () => {
  const containerSize = getContainerSize();
  const width = Math.max(Math.round(containerSize.width), 1);
  const height = Math.max(Math.round(containerSize.height), 1);

  console.log(`📦 Game size: ${width}x${height}`);

  return { width, height };
};

const initialSize = getGameSize();

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: initialSize.width,
  height: initialSize.height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initialSize.width,
    height: initialSize.height
  },
  scene: [MenuScene, GameScene, WinScene],
  backgroundColor: '#1a1a2e',
  pixelArt: false,
  antialias: true
};

// Блокировка контекстного меню
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Initialize VK Bridge and preload ads before starting the game
(async () => {
  await VKBridge.init();
  await VKBridge.preloadRewardAd();
})();

const game = new Phaser.Game(config);

// Обработчик изменения размера для всех устройств
const containerInfo = ContainerDetector.getContainerInfo();

// Функция для обработки изменения размеров
const handleResize = () => {
  const { width, height } = getGameSize();
  console.log(`📐 Resizing game to: ${width}x${height}`);
  game.scale.resize(width, height);
};

// Debounced версия для оптимизации
let resizeTimeout;
const debouncedResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 100);
};

// Устанавливаем обработчики событий resize для всех случаев
window.addEventListener('resize', debouncedResize);

if (isMobileDevice) {
  window.addEventListener('orientationchange', handleResize);
}

// Для iframe также отслеживаем изменения размера родительского окна
if (containerInfo.isIframe) {
  // Проверяем изменения размеров с интервалом
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;

  setInterval(() => {
    if (window.innerWidth !== lastWidth || window.innerHeight !== lastHeight) {
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
      handleResize();
    }
  }, 500);
}

// Логируем информацию о контейнере при запуске (для отладки)
if (window.location.search.includes('debug') || containerInfo.isEmbedded) {
  ContainerDetector.logInfo();
}
