import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import WinScene from './scenes/WinScene.js';
import { VKBridge } from './utils/VKBridge.js';
import { ContainerDetector } from './utils/ContainerDetector.js';

const MOBILE_PORTRAIT_SIZE = { width: 1080, height: 1920 };
const MOBILE_LANDSCAPE_SIZE = { width: 1920, height: 1080 };
const EMBEDDED_CONTAINER_PADDING_X = 16;
const EMBEDDED_CONTAINER_PADDING_TOP = 16;
const EMBEDDED_CONTAINER_PADDING_BOTTOM = 32;
const isMobileDevice = /android|iphone|ipad|ipod|windows phone|mobile/i.test(
  navigator.userAgent ?? ''
);

let vkClientRect = null;

/**
 * Получает размеры контейнера game-container
 */
const getContainerSize = () => {
  const container = document.getElementById('game-container');

  if (container) {
    const width = Math.round(container.clientWidth);
    const height = Math.round(container.clientHeight);

    if (width > 0 && height > 0) {
      return { width, height };
    }
  }

  // Fallback на размеры viewport
  return ContainerDetector.getContainerSize();
};

/**
 * Получает размер контейнера из VK Bridge с fallback
 */
const getEmbeddedContainerSize = () => {
  const baseWidth = Math.round(vkClientRect?.width ?? window.innerWidth);
  const baseHeight = Math.round(vkClientRect?.height ?? window.innerHeight);

  const width = Math.max(320, baseWidth - EMBEDDED_CONTAINER_PADDING_X * 2);
  const height = Math.max(320, baseHeight - EMBEDDED_CONTAINER_PADDING_TOP - EMBEDDED_CONTAINER_PADDING_BOTTOM);

  return {
    width,
    height
  };
};

/**
 * Применяет отступы контейнера для iframe/webview
 */
const applyEmbeddedContainerPadding = (isEmbedded) => {
  const container = document.getElementById('game-container');
  if (!container) {
    return;
  }

  if (isEmbedded) {
    container.style.paddingTop = `${EMBEDDED_CONTAINER_PADDING_TOP}px`;
    container.style.paddingRight = `${EMBEDDED_CONTAINER_PADDING_X}px`;
    container.style.paddingBottom = `${EMBEDDED_CONTAINER_PADDING_BOTTOM}px`;
    container.style.paddingLeft = `${EMBEDDED_CONTAINER_PADDING_X}px`;
    container.style.width = '100%';
    container.style.height = '100%';
  } else {
    container.style.padding = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
  }
};

/**
 * Определяет размер игры с учетом контекста (iframe/webView или обычный браузер)
 */
const getGameSize = () => {
  const containerInfo = ContainerDetector.getContainerInfo();

  if (containerInfo.isEmbedded) {
    const embeddedSize = getEmbeddedContainerSize();
    const aspectRatio = embeddedSize.width / embeddedSize.height;

    const optimalSize = ContainerDetector.getOptimalGameSize({
      baseWidth: 1920,
      minAspectRatio: 0.3,
      maxAspectRatio: 3.0,
      containerSize: embeddedSize
    });

    console.log(
      `📦 Embedded container size: ${embeddedSize.width}x${embeddedSize.height}, aspect ratio: ${aspectRatio.toFixed(3)}`
    );
    console.log(
      `🎮 Detected ${containerInfo.containerType} context, using optimal size: ${optimalSize.width}x${optimalSize.height}`
    );

    return {
      width: optimalSize.width,
      height: optimalSize.height
    };
  }

  const containerSize = getContainerSize();
  const aspectRatio = containerSize.width / containerSize.height;

  console.log(`📦 Container size: ${containerSize.width}x${containerSize.height}, aspect ratio: ${aspectRatio.toFixed(3)}`);

  if (!isMobileDevice) {
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

const containerInfo = ContainerDetector.getContainerInfo();
applyEmbeddedContainerPadding(containerInfo.isEmbedded);

const game = new Phaser.Game(config);

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

// Initialize VK Bridge and preload ads before starting the game
(async () => {
  await VKBridge.init();
  await VKBridge.preloadRewardAd();

  vkClientRect = await VKBridge.getClientRect();
  if (vkClientRect) {
    console.log(`🖼️ VK iFrame rect: ${vkClientRect.width}x${vkClientRect.height}`);
  }

  handleResize();

  // Подписываемся на события VK Bridge
  VKBridge.subscribe((e) => {
    if (e.detail.type === 'VKWebAppUpdateConfig') {
      console.log('🔄 VK Config updated, checking for resize...');
      debouncedResize();
    }

    if (e.detail.type === 'VKWebAppUpdateViewSettings') {
      debouncedResize();
    }
  });
})();

// Устанавливаем обработчики событий resize для всех случаев
window.addEventListener('resize', debouncedResize);

if (isMobileDevice) {
  window.addEventListener('orientationchange', handleResize);
}

if (containerInfo.isIframe) {
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

if (window.location.search.includes('debug') || containerInfo.isEmbedded) {
  ContainerDetector.logInfo();
}
