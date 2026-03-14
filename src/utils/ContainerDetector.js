/**
 * Утилита для определения контекста открытия приложения
 * (iframe, webView, обычный браузер) и автоматического
 * определения соотношения сторон контейнера
 */
export class ContainerDetector {
  /**
   * Проверяет, открыто ли приложение внутри iframe
   * @returns {boolean}
   */
  static isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      // Если возникает ошибка безопасности при доступе к window.top,
      // то мы точно находимся в iframe с другим доменом
      return true;
    }
  }

  /**
   * Проверяет, открыто ли приложение в WebView (мобильное приложение)
   * @returns {boolean}
   */
  static isInWebView() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;

    // Проверка на различные WebView индикаторы
    const webViewPatterns = [
      // iOS WebView
      /WebView/i,
      /(iPhone|iPod|iPad)(?!.*Safari\/)/i,

      // Android WebView
      /wv/i,
      /Android.*Version\/[\d.]+.*Chrome\/[.0-9]*.*Mobile/i,

      // VK WebView
      /VKCOM/i,

      // Telegram WebView
      /Telegram/i,

      // Facebook WebView
      /FBAN|FBAV/i,

      // Instagram WebView
      /Instagram/i,

      // Twitter WebView
      /Twitter/i
    ];

    return webViewPatterns.some(pattern => pattern.test(ua));
  }

  /**
   * Определяет, находится ли приложение в встроенном контейнере
   * (iframe или webView)
   * @returns {boolean}
   */
  static isEmbedded() {
    return this.isInIframe() || this.isInWebView();
  }

  /**
   * Получает информацию о контейнере
   * @returns {{isEmbedded: boolean, isIframe: boolean, isWebView: boolean, containerType: string}}
   */
  static getContainerInfo() {
    const isIframe = this.isInIframe();
    const isWebView = this.isInWebView();
    const isEmbedded = isIframe || isWebView;

    let containerType = 'browser';
    if (isWebView) {
      containerType = 'webview';
    } else if (isIframe) {
      containerType = 'iframe';
    }

    return {
      isEmbedded,
      isIframe,
      isWebView,
      containerType
    };
  }

  /**
   * Получает размеры контейнера (viewport)
   * @returns {{width: number, height: number}}
   */
  static getContainerSize() {
    // Используем различные методы для максимальной совместимости
    const width = window.innerWidth ||
                  document.documentElement.clientWidth ||
                  document.body.clientWidth;

    const height = window.innerHeight ||
                   document.documentElement.clientHeight ||
                   document.body.clientHeight;

    return { width, height };
  }

  /**
   * Вычисляет соотношение сторон контейнера
   * @returns {number} - соотношение сторон (ширина / высота)
   */
  static getAspectRatio() {
    const { width, height } = this.getContainerSize();
    return width / height;
  }

  /**
   * Определяет оптимальные размеры игры на основе контейнера
   * @param {Object} options - опции конфигурации
   * @param {number} options.baseWidth - базовая ширина для расчетов (по умолчанию 1920)
   * @param {number} options.minAspectRatio - минимальное соотношение сторон (по умолчанию 0.5 - портрет)
   * @param {number} options.maxAspectRatio - максимальное соотношение сторон (по умолчанию 2.0 - ландшафт)
   * @param {{width:number, height:number}} options.containerSize - явные размеры контейнера
   * @returns {{width: number, height: number, aspectRatio: number}}
   */
  static getOptimalGameSize(options = {}) {
    const {
      baseWidth = 1920,
      minAspectRatio = 0.3,  // Поддержка узкой портретной ориентации
      maxAspectRatio = 3.0,   // Поддержка ультра-широкой ландшафтной
      containerSize
    } = options;

    const { width, height } = containerSize ?? this.getContainerSize();
    let aspectRatio = width / height;

    // Ограничиваем соотношение сторон
    aspectRatio = Math.max(minAspectRatio, Math.min(maxAspectRatio, aspectRatio));

    // Вычисляем размеры игры
    let gameWidth, gameHeight;

    if (aspectRatio < 1) {
      // Портретная ориентация
      gameWidth = baseWidth * aspectRatio;
      gameHeight = baseWidth;
    } else {
      // Ландшафтная ориентация
      gameWidth = baseWidth;
      gameHeight = baseWidth / aspectRatio;
    }

    // Округляем до целых чисел
    gameWidth = Math.round(gameWidth);
    gameHeight = Math.round(gameHeight);

    return {
      width: gameWidth,
      height: gameHeight,
      aspectRatio: aspectRatio,
      containerWidth: width,
      containerHeight: height
    };
  }

  /**
   * Получает полную информацию о контейнере и рекомендуемых размерах игры
   * @param {Object} options - опции для getOptimalGameSize
   * @returns {Object}
   */
  static getFullInfo(options = {}) {
    const containerInfo = this.getContainerInfo();
    const containerSize = this.getContainerSize();
    const optimalSize = this.getOptimalGameSize(options);

    return {
      ...containerInfo,
      container: containerSize,
      optimal: optimalSize,
      aspectRatio: this.getAspectRatio()
    };
  }

  /**
   * Логирует информацию о контейнере в консоль (для отладки)
   */
  static logInfo() {
    const info = this.getFullInfo();

    console.group('🎮 Container Detection Info');
    console.log('📦 Container Type:', info.containerType);
    console.log('🖼️  Is Embedded:', info.isEmbedded);
    console.log('   - Is iFrame:', info.isIframe);
    console.log('   - Is WebView:', info.isWebView);
    console.log('📏 Container Size:', `${info.container.width}x${info.container.height}`);
    console.log('📐 Aspect Ratio:', info.aspectRatio.toFixed(3));
    console.log('🎯 Optimal Game Size:', `${info.optimal.width}x${info.optimal.height}`);
    console.log('📊 Game Aspect Ratio:', info.optimal.aspectRatio.toFixed(3));
    console.groupEnd();

    return info;
  }
}
