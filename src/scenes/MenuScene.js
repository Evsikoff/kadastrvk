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

    // Парсим карты для получения количества уровней
    const mapData = this.cache.text.get('maps');
    this.maps = MapParser.parseMapFile(mapData);

    // Создаем меню
    this.createMenu();
  }

  createMenu() {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;

    // Заголовок
    const titleY = this.isMobile
      ? (this.currentOrientation === 'portrait' ? 120 : 100)
      : 150;

    this.add.text(centerX, titleY - 50, 'Игра', {
      fontSize: this.isMobile ? '42px' : '52px',
      color: '#2F4858',
      fontFamily: 'Georgia',
      fontStyle: 'italic bold',
      stroke: '#9B2226',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#f0e9db',
        blur: 6,
        fill: true
      }
    }).setOrigin(0.5);

    this.add.text(centerX, titleY + 20, 'КАДАСТР', {
      fontSize: this.isMobile ? '64px' : '72px',
      color: '#3A7CA5',
      fontFamily: 'Georgia',
      fontStyle: 'bold',
      stroke: '#1B4965',
      strokeThickness: 4,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#f0e9db',
        blur: 10,
        fill: true
      }
    }).setOrigin(0.5);

    // Кнопки меню
    const buttonWidth = this.isMobile
      ? Math.min(this.screenWidth - 100, 800)
      : 600;
    const buttonHeight = this.isMobile ? 75 : 80;
    const buttonGap = 20;
    const startY = centerY + (this.isMobile ? -50 : 0);

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
    const button = this.add.graphics();

    const drawButton = (state) => {
      const colors = state === 'hover'
        ? [0x4F8FBF, 0x4F8FBF, 0x2F6690, 0x2F6690]
        : [0x3A7CA5, 0x3A7CA5, 0x1B4965, 0x1B4965];

      button.clear();
      button.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
      button.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
      button.lineStyle(3, 0x9B2226, 1);
      button.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    };

    drawButton('default');

    const rect = new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height);
    button.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', onClick);
    button.on('pointerover', () => drawButton('hover'));
    button.on('pointerout', () => drawButton('default'));

    const fontSize = this.isMobile ? '26px' : '28px';
    this.add.text(x, y, label, {
      fontSize: fontSize,
      color: '#F6F0E6',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#9B2226',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  async continueGame() {
    // Загружаем сохраненный уровень
    const savedLevel = await GameProgress.loadLevel();
    const startLevel = savedLevel ?? 0;

    // Запускаем игру с сохраненного уровня
    this.scene.start('GameScene', { mapIndex: startLevel });
  }

  showNewGameConfirm() {
    // Показываем модальное окно подтверждения
    const width = this.screenWidth;
    const height = this.screenHeight;
    const modalWidth = Math.min(width - 100, 700);
    const modalHeight = Math.min(height - 200, 400);
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

    // Текст
    const text = this.add.text(
      width / 2,
      modalY + 80,
      'При запуске игры заново,\nсохранение вашего игрового\nпроцесса будет потеряно.\n\nВы уверены, что хотите\nначать новую игру?',
      {
        fontSize: this.isMobile ? '24px' : '28px',
        color: '#2F4858',
        fontFamily: 'Arial',
        align: 'center',
        lineSpacing: 8
      }
    ).setOrigin(0.5, 0);
    container.add(text);

    // Кнопки
    const buttonWidth = 200;
    const buttonHeight = 70;
    const buttonY = modalY + modalHeight - 100;
    const spacing = 50;

    // Кнопка "Да"
    this.createConfirmButton(
      width / 2 - buttonWidth / 2 - spacing / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      'Да',
      async () => {
        container.destroy();
        await GameProgress.clearProgress();
        this.scene.start('GameScene', { mapIndex: 0 });
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
    const button = this.add.graphics();

    const drawButton = (state) => {
      const c = state === 'hover' ? hoverColors : colors;
      button.clear();
      button.fillGradientStyle(c[0], c[1], c[2], c[3], 1);
      button.fillRoundedRect(x - width / 2, y - height / 2, width, height, 14);
      button.lineStyle(3, 0x9B2226, 1);
      button.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 14);
    };

    drawButton('default');

    const rect = new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height);
    button.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', onClick);
    button.on('pointerover', () => drawButton('hover'));
    button.on('pointerout', () => drawButton('default'));
    container.add(button);

    const buttonLabel = this.add.text(x, y, label, {
      fontSize: '28px',
      color: '#F6F0E6',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#9B2226',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add(buttonLabel);
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
    const tileSize = this.isMobile ? 70 : 80;
    const tileGap = this.isMobile ? 10 : 15;
    const tilesPerRow = Math.floor((modalWidth - 60) / (tileSize + tileGap));
    const startX = modalX + 30;
    const startY = modalY + 100;

    const totalLevels = Math.min(this.maps.length, 100);

    for (let i = 0; i < totalLevels; i++) {
      const row = Math.floor(i / tilesPerRow);
      const col = i % tilesPerRow;
      const x = startX + col * (tileSize + tileGap) + tileSize / 2;
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
      const rect = new Phaser.Geom.Rectangle(x - size / 2, y - size / 2, size, size);
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
      fontSize: this.isMobile ? '24px' : '28px',
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
