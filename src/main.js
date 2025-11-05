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
 * Определяет размер игры с учетом контекста (iframe/webView или обычный браузер)
 */
const getGameSize = () => {
  // Получаем информацию о контейнере
  const containerInfo = ContainerDetector.getContainerInfo();

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

  // Для обычного браузера используем стандартную логику
  if (!isMobileDevice) {
    return { width: 1920, height: 1280 };
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
    autoCenter: Phaser.Scale.CENTER_BOTH
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

// Обработчик изменения размера для мобильных устройств и встроенных контейнеров
const containerInfo = ContainerDetector.getContainerInfo();
if (isMobileDevice || containerInfo.isEmbedded) {
  const handleResize = () => {
    const { width, height } = getGameSize();
    console.log(`📐 Resizing game to: ${width}x${height}`);
    game.scale.resize(width, height);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  // Для iframe также отслеживаем изменения размера родительского окна
  if (containerInfo.isIframe) {
    // Добавляем небольшую задержку для корректной обработки изменения размера
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
  }
}

// Логируем информацию о контейнере при запуске (для отладки)
if (window.location.search.includes('debug') || containerInfo.isEmbedded) {
  ContainerDetector.logInfo();
}
