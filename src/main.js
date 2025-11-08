import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import WinScene from './scenes/WinScene.js';
import { VKBridge } from './utils/VKBridge.js';
import { ContainerDetector } from './utils/ContainerDetector.js';

const MOBILE_PORTRAIT_SIZE = { width: 1080, height: 1920 };
const MOBILE_LANDSCAPE_SIZE = { width: 1920, height: 1080 };
const isMobileDevice = /android|iphone|ipad|ipod|windows phone|mobile/i.test(
  navigator.userAgent ?? ''
);

/**
 * Получает размеры контейнера game-container
 */
const getContainerSize = () => {
  const container = document.getElementById('game-container');
  if (container) {
    return {
      width: container.clientWidth,
      height: container.clientHeight
    };
  }
  // Fallback на размеры viewport
  return ContainerDetector.getContainerSize();
};

/**
 * Определяет размер игры с учетом контекста (iframe/webView или обычный браузер)
 */
const getGameSize = () => {
  // Получаем информацию о контейнере
  const containerInfo = ContainerDetector.getContainerInfo();

  // Получаем размеры game-container
  const containerSize = getContainerSize();
  const aspectRatio = containerSize.width / containerSize.height;

  console.log(`📦 Container size: ${containerSize.width}x${containerSize.height}, aspect ratio: ${aspectRatio.toFixed(3)}`);

  // Если приложение открыто в iframe или webView, используем автоматическое определение размеров
  if (containerInfo.isEmbedded) {
    const optimalSize = ContainerDetector.getOptimalGameSize({
      baseWidth: 1920,
      minAspectRatio: 0.5,  // Поддержка портретной ориентации (9:16)
      maxAspectRatio: 2.0   // Поддержка широкой ландшафтной (16:9)
    });

    console.log(`🎮 Detected ${containerInfo.containerType} context, using optimal size: ${optimalSize.width}x${optimalSize.height}`);

    return {
      width: optimalSize.width,
      height: optimalSize.height
    };
  }

  // Для обычного браузера используем размеры контейнера напрямую
  if (!isMobileDevice) {
    // Используем размеры контейнера для заполнения на 100%
    // Canvas будет масштабироваться через Phaser.Scale.FIT
    return {
      width: Math.round(containerSize.width),
      height: Math.round(containerSize.height)
    };
  }

  const isPortrait = window.innerHeight > window.innerWidth;
  return isPortrait ? MOBILE_PORTRAIT_SIZE : MOBILE_LANDSCAPE_SIZE;
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
