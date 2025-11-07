import Phaser from 'phaser';
import { GameProgress } from '../utils/GameProgress.js';
import { MapParser } from '../utils/MapParser.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.isMobile = false;
    this.currentOrientation = 'landscape';
    this.maps = [];
  }

  preload() {
    // Загружаем фоновое изображение
    this.load.image('menu_background', '/back.jpg');

    // Загружаем файл с картами для определения количества уровней
    this.load.text('maps', '/maps/kadastrmapsmall.txt');
  }

  create() {
    this.screenWidth = this.scale.gameSize.width;
    this.screenHeight = this.scale.gameSize.height;
    this.isMobile = !this.sys.game.device.os.desktop;
    this.currentOrientation =
      this.scale.orientation === Phaser.Scale.PORTRAIT ? 'portrait' : 'landscape';

    // Добавляем фон
    const bg = this.add.tileSprite(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      'menu_background'
    );

    const targetTileSize = 1024;
    const backgroundSource = this.textures.get('menu_background').getSourceImage();
    const tilesX = Math.max(1, Math.round(this.screenWidth / targetTileSize));
    const tilesY = Math.max(1, Math.round(this.screenHeight / targetTileSize));
    const tileScaleX = this.screenWidth / (backgroundSource.width * tilesX);
    const tileScaleY = this.screenHeight / (backgroundSource.height * tilesY);
    bg.setTileScale(tileScaleX, tileScaleY);

    if (bg.preFX) {
      bg.preFX.addBlur(1, 4, 4, 1.5);
    }

    // Парсим карты для получения количества уровней
    const mapData = this.cache.text.get('maps');
    this.maps = MapParser.parseMapFile(mapData);

    // Создаем меню
    this.createMenu();
  }

  createMenu() {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;

    // Заголовок в правом нижнем углу
    const titlePaddingX = this.isMobile ? 24 : 32;
    const titlePaddingY = this.isMobile ? 32 : 40;
    const titleBaseX = this.screenWidth - titlePaddingX;
    const titleBaseY = this.screenHeight - titlePaddingY;

    const mainTitleFontSize = this.isMobile ? 80 : 64;
    const subtitleFontSize = this.isMobile ? 42 : 36;

    const title = this.add.text(titleBaseX, titleBaseY, 'КАДАСТР', {
      fontSize: `${mainTitleFontSize}px`,
      color: '#3A7CA5',
      fontFamily: 'Georgia',
      fontStyle: 'bold',
      stroke: '#1B4965',
      strokeThickness: 5,
      shadow: {
        offsetX: 6,
        offsetY: 6,
        color: '#000000',
        blur: 15,
        fill: true
      }
    }).setOrigin(1, 1);

    // Добавляем тонкую пульсацию для заголовка на десктопе
    if (!this.isMobile) {
      this.tweens.add({
        targets: title,
        scale: 1.02,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const subtitle = this.add.text(titleBaseX, title.y - title.displayHeight - (this.isMobile ? 16 : 16), 'Игра', {
      fontSize: `${subtitleFontSize}px`,
      color: '#9B2226',
      fontFamily: 'Georgia',
      fontStyle: 'italic bold',
      stroke: '#B56576',
      strokeThickness: 4,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 10,
        fill: true
      }
    });
    subtitle.setOrigin(1, 1);

    // Кнопки меню
    const buttonWidth = this.isMobile
      ? Math.min(this.screenWidth - 100, 800)
      : 400;
    const buttonHeight = this.isMobile ? 75 : 60;
    const buttonGap = this.isMobile ? 20 : 12;
    const startY = centerY + (this.isMobile ? -50 : -90);

    const buttons = [
      { label: 'Продолжить игру', action: () => this.continueGame() },
      { label: 'Новая игра', action: () => this.showNewGameConfirm() },
      { label: 'Выбрать уровень', action: () => this.showLevelSelect() },
      { label: 'Правила игры', action: () => this.showRulesModal() }
    ];

    buttons.forEach((button, index) => {
      const y = startY + index * (buttonHeight + buttonGap);
      this.createMenuButton(centerX, y, buttonWidth, buttonHeight, button.label, button.action);
    });
  }

  createMenuButton(x, y, width, height, label, onClick) {
    // Создаем контейнер для кнопки (для анимации)
    const buttonContainer = this.add.container(x, y);

    // Создаем тень для кнопки
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-width / 2 + 6, -height / 2 + 6, width, height, 16);
    buttonContainer.add(shadow);

    // Основная кнопка
    const button = this.add.graphics();

    const drawButton = (state) => {
      const colors = state === 'hover'
        ? [0x5FA8D3, 0x5FA8D3, 0x3A7CA5, 0x3A7CA5]
        : state === 'press'
        ? [0x2F6690, 0x2F6690, 0x1B4965, 0x1B4965]
        : [0x3A7CA5, 0x3A7CA5, 0x1B4965, 0x1B4965];

      button.clear();

      // Основной градиент
      button.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
      button.fillRoundedRect(-width / 2, -height / 2, width, height, 16);

      // Внутреннее свечение при hover
      if (state === 'hover') {
        button.lineStyle(2, 0xFFFFFF, 0.3);
        button.strokeRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, 12);
      }

      // Граница
      button.lineStyle(4, 0x9B2226, 1);
      button.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    };

    drawButton('default');
    buttonContainer.add(button);

    const fontSize = this.isMobile ? '26px' : '24px';
    const buttonLabel = this.add.text(0, 0, label, {
      fontSize: fontSize,
      color: '#F6F0E6',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#1B4965',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true
      }
    }).setOrigin(0.5);
    buttonContainer.add(buttonLabel);

    const rect = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    button.setInteractive(rect, Phaser.Geom.Rectangle.Contains);

    // Анимация hover
    button.on('pointerover', () => {
      drawButton('hover');
      this.tweens.add({
        targets: buttonContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2'
      });
      this.tweens.add({
        targets: shadow,
        alpha: 0.5,
        duration: 200
      });
    });

    // Анимация out
    button.on('pointerout', () => {
      drawButton('default');
      this.tweens.add({
        targets: buttonContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2'
      });
      this.tweens.add({
        targets: shadow,
        alpha: 1,
        duration: 200
      });
    });

    // Анимация нажатия
    button.on('pointerdown', () => {
      drawButton('press');
      this.tweens.add({
        targets: buttonContainer,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          onClick();
        }
      });
    });
  }

  async showLoadingOverlay(action) {
    const width = this.screenWidth;
    const height = this.screenHeight;

    const container = this.add.container(0, 0);
    container.setDepth(10000);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.65);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
    container.add(overlay);

    const loadingText = this.add.text(width / 2, height / 2 - 40, 'Загрузка', {
      fontSize: this.isMobile ? '40px' : '48px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(loadingText);

    const spinner = this.add.graphics({ x: width / 2, y: height / 2 + 40 });
    spinner.lineStyle(6, 0xFFFFFF, 1);
    spinner.beginPath();
    spinner.arc(0, 0, 35, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(300), false);
    spinner.strokePath();
    container.add(spinner);

    const spinTween = this.tweens.add({
      targets: spinner,
      angle: 360,
      duration: 800,
      repeat: -1
    });

    return new Promise((resolve) => {
      this.time.delayedCall(3000, async () => {
        if (action) {
          await action();
        }
        spinTween.stop();
        container.destroy();
        resolve();
      });
    });
  }

  async continueGame() {
    await this.showLoadingOverlay(async () => {
      // Загружаем сохраненный уровень
      const savedLevel = await GameProgress.loadLevel();
      const startLevel = savedLevel ?? 0;

      // Запускаем игру с сохраненного уровня
      this.scene.start('GameScene', { mapIndex: startLevel });
    });
  }

  showNewGameConfirm() {
    // Показываем модальное окно подтверждения
    const width = this.screenWidth;
    const height = this.screenHeight;
    const modalWidth = Math.min(width - 120, 620);
    const modalPadding = this.isMobile ? 24 : 36;
    const sectionGap = this.isMobile ? 22 : 28;
    const buttonHeight = this.isMobile ? 60 : 70;

    const confirmText =
      'При запуске игры заново,\nсохранение вашего игрового\nпроцесса будет потеряно.\n\nВы уверены, что хотите\nначать новую игру?';

    const textStyle = {
      fontSize: this.isMobile ? '24px' : '28px',
      color: '#2F4858',
      fontFamily: 'Arial',
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: modalWidth - modalPadding * 2 }
    };

    const textMetrics = this.make.text({
      text: confirmText,
      style: textStyle,
      add: false
    });
    const textHeight = textMetrics.height;
    textMetrics.destroy();

    const neededHeight = modalPadding * 2 + textHeight + sectionGap + buttonHeight;
    const minModalHeight = this.isMobile ? 340 : 360;
    const maxModalHeight = height - (this.isMobile ? 40 : 80);
    const modalHeight = Math.min(Math.max(neededHeight, minModalHeight), maxModalHeight);
    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2;

    const container = this.add.container(0, 0);
    container.setDepth(3000);

    // Полупрозрачный фон
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
    container.add(overlay);

    // Тень
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(modalX + 15, modalY + 15, modalWidth, modalHeight, 20);
    container.add(shadow);

    // Фон
    const modalBg = this.add.graphics();
    modalBg.fillStyle(0xF6F0E6, 0.98);
    modalBg.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 20);
    modalBg.lineStyle(4, 0xB56576, 1);
    modalBg.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 20);
    container.add(modalBg);

    // Блок с текстом
    const textBlockTop = modalY + modalPadding;
    const textBg = this.add.graphics();
    textBg.fillStyle(0xffffff, 0.12);
    textBg.fillRoundedRect(
      modalX + 20,
      textBlockTop - 16,
      modalWidth - 40,
      textHeight + 32,
      16
    );
    container.add(textBg);

    const text = this.add
      .text(width / 2, textBlockTop, confirmText, textStyle)
      .setOrigin(0.5, 0);
    container.add(text);

    // Блок с кнопками
    const buttonAreaTop = modalY + modalHeight - modalPadding - buttonHeight - 32;
    const buttonsBg = this.add.graphics();
    buttonsBg.fillStyle(0xffffff, 0.08);
    buttonsBg.fillRoundedRect(
      modalX + 20,
      buttonAreaTop,
      modalWidth - 40,
      buttonHeight + 52,
      16
    );
    container.add(buttonsBg);

    // Кнопки
    const buttonWidth = Math.min(220, modalWidth / 2 - 10);
    const buttonY = modalY + modalHeight - modalPadding - buttonHeight / 2;
    const spacing = this.isMobile ? 30 : 40;

    // Кнопка "Да"
    this.createConfirmButton(
      width / 2 - buttonWidth / 2 - spacing / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      'Да',
      async () => {
        container.destroy();
        await this.showLoadingOverlay(async () => {
          await GameProgress.clearProgress();
          this.scene.start('GameScene', { mapIndex: 0 });
        });
      },
      container,
      [0xB56576, 0xB56576, 0x9B2226, 0x9B2226],
      [0xC97585, 0xC97585, 0xAF3336, 0xAF3336]
    );

    // Кнопка "Нет"
    this.createConfirmButton(
      width / 2 + buttonWidth / 2 + spacing / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      'Нет',
      () => container.destroy(),
      container,
      [0x3A7CA5, 0x3A7CA5, 0x1B4965, 0x1B4965],
      [0x4F8FBF, 0x4F8FBF, 0x2F6690, 0x2F6690]
    );

    // Анимация
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  createConfirmButton(x, y, width, height, label, onClick, container, colors, hoverColors) {
    // Создаем контейнер для кнопки
    const btnContainer = this.add.container(x, y);

    // Тень кнопки
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-width / 2 + 4, -height / 2 + 4, width, height, 14);
    btnContainer.add(shadow);

    const button = this.add.graphics();

    const drawButton = (state) => {
      const c = state === 'hover' ? hoverColors : colors;
      button.clear();
      button.fillGradientStyle(c[0], c[1], c[2], c[3], 1);
      button.fillRoundedRect(-width / 2, -height / 2, width, height, 14);

      // Внутреннее свечение при hover
      if (state === 'hover') {
        button.lineStyle(2, 0xFFFFFF, 0.25);
        button.strokeRoundedRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6, 10);
      }

      button.lineStyle(3, 0x9B2226, 1);
      button.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    };

    drawButton('default');
    btnContainer.add(button);

    const buttonLabel = this.add.text(0, 0, label, {
      fontSize: '28px',
      color: '#F6F0E6',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#1B4965',
      strokeThickness: 2,
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true
      }
    }).setOrigin(0.5);
    btnContainer.add(buttonLabel);

    const rect = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    button.setInteractive(rect, Phaser.Geom.Rectangle.Contains);

    // Анимации
    button.on('pointerover', () => {
      drawButton('hover');
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Power2'
      });
    });

    button.on('pointerout', () => {
      drawButton('default');
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2'
      });
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          onClick();
        }
      });
    });

    container.add(btnContainer);
  }

  async showLevelSelect() {
    // Получаем максимальный доступный уровень
    const maxLevel = await GameProgress.getMaxLevel();
    const maxAvailableLevel = maxLevel ?? 0;

    const width = this.screenWidth;
    const height = this.screenHeight;
    const modalWidth = Math.min(width - 60, 1000);
    const modalHeight = Math.min(height - 100, 1400);
    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2;

    const container = this.add.container(0, 0);
    container.setDepth(3000);

    // Полупрозрачный фон
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => container.destroy());
    container.add(overlay);

    // Тень
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(modalX + 15, modalY + 15, modalWidth, modalHeight, 20);
    container.add(shadow);

    // Фон
    const modalBg = this.add.graphics();
    modalBg.fillStyle(0xF6F0E6, 0.98);
    modalBg.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 20);
    modalBg.lineStyle(4, 0x3A7CA5, 1);
    modalBg.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 20);
    container.add(modalBg);

    // Заголовок
    const title = this.add.text(
      width / 2,
      modalY + 40,
      'Выбрать уровень',
      {
        fontSize: '36px',
        color: '#1B4965',
        fontFamily: 'Georgia',
        fontStyle: 'bold',
        stroke: '#3A7CA5',
        strokeThickness: 2
      }
    ).setOrigin(0.5);
    container.add(title);

    // Создаем тайлы уровней
    const tileSize = this.isMobile ? 55 : 65;
    const tileGap = this.isMobile ? 8 : 10;
    const tilesPerRow = Math.floor((modalWidth - 60) / (tileSize + tileGap));
    const startY = modalY + 100;

    const totalLevels = Math.min(this.maps.length, 100);

    for (let i = 0; i < totalLevels; i++) {
      const row = Math.floor(i / tilesPerRow);
      const col = i % tilesPerRow;
      const rowTileCount = Math.min(tilesPerRow, totalLevels - row * tilesPerRow);
      const rowWidth = rowTileCount * tileSize + Math.max(rowTileCount - 1, 0) * tileGap;
      const rowStartX = modalX + (modalWidth - rowWidth) / 2 + tileSize / 2;
      const x = rowStartX + col * (tileSize + tileGap);
      const y = startY + row * (tileSize + tileGap) + tileSize / 2;

      const isAvailable = i <= maxAvailableLevel;
      this.createLevelTile(x, y, tileSize, i + 1, isAvailable, container);
    }

    // Кнопка закрытия
    const closeButtonSize = 50;
    const closeX = modalX + modalWidth - closeButtonSize - 15;
    const closeY = modalY + 15;

    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xFF0000, 0.8);
    closeBg.fillCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
    closeBg.lineStyle(3, 0x9B2226, 1);
    closeBg.strokeCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);

    const closeCircle = new Phaser.Geom.Circle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
    closeBg.setInteractive(closeCircle, Phaser.Geom.Circle.Contains);
    closeBg.on('pointerdown', () => container.destroy());
    closeBg.on('pointerover', () => {
      closeBg.clear();
      closeBg.fillStyle(0xFF4444, 0.9);
      closeBg.fillCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
      closeBg.lineStyle(3, 0x9B2226, 1);
      closeBg.strokeCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
    });
    closeBg.on('pointerout', () => {
      closeBg.clear();
      closeBg.fillStyle(0xFF0000, 0.8);
      closeBg.fillCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
      closeBg.lineStyle(3, 0x9B2226, 1);
      closeBg.strokeCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
    });
    container.add(closeBg);

    const closeText = this.add.text(
      closeX + closeButtonSize / 2,
      closeY + closeButtonSize / 2,
      'X',
      {
        fontSize: '32px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    container.add(closeText);

    // Анимация
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  createLevelTile(x, y, size, level, isAvailable, container) {
    const tile = this.add.graphics();

    const drawTile = (state) => {
      tile.clear();

      if (!isAvailable) {
        // Недоступный уровень
        tile.fillStyle(0x888888, 0.5);
        tile.fillRoundedRect(x - size / 2, y - size / 2, size, size, 8);
        tile.lineStyle(2, 0x666666, 1);
        tile.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 8);
      } else {
        // Доступный уровень
        const color = state === 'hover' ? 0x4F8FBF : 0x3A7CA5;
        tile.fillStyle(color, 1);
        tile.fillRoundedRect(x - size / 2, y - size / 2, size, size, 8);
        tile.lineStyle(3, 0x1B4965, 1);
        tile.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 8);
      }
    };

    drawTile('default');

    if (isAvailable) {
      // Делаем интерактивную область немного меньше для предотвращения перекрытий
      const interactiveSize = size - 2;
      const rect = new Phaser.Geom.Rectangle(x - interactiveSize / 2, y - interactiveSize / 2, interactiveSize, interactiveSize);
      tile.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
      tile.on('pointerdown', () => {
        container.destroy();
        this.scene.start('GameScene', { mapIndex: level - 1 });
      });
      tile.on('pointerover', () => drawTile('hover'));
      tile.on('pointerout', () => drawTile('default'));
    }

    container.add(tile);

    const label = this.add.text(x, y, level.toString(), {
      fontSize: this.isMobile ? '20px' : '24px',
      color: isAvailable ? '#F6F0E6' : '#CCCCCC',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(label);
  }

  showRulesModal() {
    const width = this.screenWidth;
    const height = this.screenHeight;
    const modalWidth = Math.min(width - 100, 900);
    const modalHeight = Math.min(height - 120, 1200);
    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2;

    const container = this.add.container(0, 0);
    container.setDepth(3000);

    // Полупрозрачный фон
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => container.destroy());
    container.add(overlay);

    // Тень
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(modalX + 15, modalY + 15, modalWidth, modalHeight, 20);
    container.add(shadow);

    // Фон
    const modalBg = this.add.graphics();
    modalBg.fillStyle(0xF6F0E6, 0.98);
    modalBg.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 20);
    modalBg.lineStyle(4, 0xB56576, 1);
    modalBg.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 20);
    container.add(modalBg);

    // Заголовок
    const title = this.add.text(
      width / 2,
      modalY + 40,
      'Правила игры',
      {
        fontSize: '36px',
        color: '#9B2226',
        fontFamily: 'Georgia',
        fontStyle: 'bold',
        stroke: '#B56576',
        strokeThickness: 2
      }
    ).setOrigin(0.5);
    container.add(title);

    // Текст правил
    const rulesText = `ОБ ИГРЕ:

Вы - работник кадастровой фирмы в выдуманном государстве. Ваша задача - спроектировать размещение 8 домов на участках коттеджного поселка.

ПРАВИЛА:
• На поле 8×8 есть участки 8 разных цветов
• В каждом ряду и столбце должно быть по одному дому
• Дома не могут стоять в соседних клетках (даже по диагонали)
• В каждой цветовой зоне должен быть ровно один дом

УПРАВЛЕНИЕ:
• Клик по пустой ячейке - построить дом
• Клик по дому - снести дом
• Клик по "X" - показывает, какой дом блокирует эту ячейку
• Кнопка "Подсказка" - автоматически строит правильный дом

Символы "X" показывают ячейки, заблокированные построенными домами. При клике на "X" все связанные метки подсвечиваются желтым.`;

    const fontSize = this.isMobile ? '18px' : '20px';
    const contentText = this.add.text(
      modalX + 30,
      modalY + 90,
      rulesText,
      {
        fontSize: fontSize,
        color: '#2F4858',
        fontFamily: 'Arial',
        wordWrap: { width: modalWidth - 60 },
        lineSpacing: 6
      }
    );
    container.add(contentText);

    // Кнопка закрытия
    const closeButtonSize = 50;
    const closeX = modalX + modalWidth - closeButtonSize - 15;
    const closeY = modalY + 15;

    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xFF0000, 0.8);
    closeBg.fillCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
    closeBg.lineStyle(3, 0x9B2226, 1);
    closeBg.strokeCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);

    const closeCircle = new Phaser.Geom.Circle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
    closeBg.setInteractive(closeCircle, Phaser.Geom.Circle.Contains);
    closeBg.on('pointerdown', () => container.destroy());
    closeBg.on('pointerover', () => {
      closeBg.clear();
      closeBg.fillStyle(0xFF4444, 0.9);
      closeBg.fillCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
      closeBg.lineStyle(3, 0x9B2226, 1);
      closeBg.strokeCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
    });
    closeBg.on('pointerout', () => {
      closeBg.clear();
      closeBg.fillStyle(0xFF0000, 0.8);
      closeBg.fillCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
      closeBg.lineStyle(3, 0x9B2226, 1);
      closeBg.strokeCircle(closeX + closeButtonSize / 2, closeY + closeButtonSize / 2, closeButtonSize / 2);
    });
    container.add(closeBg);

    const closeText = this.add.text(
      closeX + closeButtonSize / 2,
      closeY + closeButtonSize / 2,
      'X',
      {
        fontSize: '32px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    container.add(closeText);

    // Анимация
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }
}
