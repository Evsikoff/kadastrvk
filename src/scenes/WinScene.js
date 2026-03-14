import Phaser from 'phaser';
import { GameProgress } from '../utils/GameProgress.js';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    const width = this.scale.gameSize.width;
    const height = this.scale.gameSize.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const isMobile = !this.sys.game.device.os.desktop;
    const isPortrait = (width / height) < 1.2;

    // Слушаем изменение размера
    let resizeTimeout;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.scene.isActive()) {
          this.scene.restart();
        }
      }, 250);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, onResize);
    });

    // Очищаем сохраненный прогресс при завершении всех уровней
    GameProgress.clearProgress();

    // Фон
    if (isMobile) {
      this.add.rectangle(centerX, centerY, width, height, 0x1a1a2e);
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x1a1a2e, 0x0f3460, 0x1a1a2e, 0x0f3460, 1);
      bg.fillRect(0, 0, width, height);
    }
    
    // Заголовок
    const titleFontSize = isPortrait ? Math.min(width * 0.12, 80) : (isMobile ? '64px' : '96px');
    const titleY = isPortrait ? height * 0.3 : centerY - (isMobile ? 150 : 200);

    const title = this.add.text(
      centerX,
      titleY,
      'Поздравляем!',
      {
        fontSize: titleFontSize,
        color: '#FFD700',
        fontFamily: 'Georgia',
        fontStyle: 'bold',
        stroke: '#9B2226',
        strokeThickness: isMobile ? 4 : 6,
        shadow: {
          offsetX: 4,
          offsetY: 4,
          color: '#000000',
          blur: 10,
          fill: true
        }
      }
    ).setOrigin(0.5);
    
    // Подзаголовок
    const subtitleFontSize = isPortrait ? Math.min(width * 0.06, 40) : (isMobile ? '32px' : '48px');
    const subtitleY = isPortrait ? title.y + (isMobile ? 70 : 100) : centerY - (isMobile ? 50 : 80);

    const subtitle = this.add.text(
      centerX,
      subtitleY,
      'Вы прошли все уровни!',
      {
        fontSize: subtitleFontSize,
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#1B4965',
        strokeThickness: 2
      }
    ).setOrigin(0.5);
    
    // Кнопка рестарта
    const buttonWidth = Math.min(width * 0.8, isMobile ? 360 : 420);
    const buttonHeight = isMobile ? 80 : 100;
    const buttonY = isPortrait ? height * 0.75 : centerY + (isMobile ? 120 : 150);

    const restartButtonContainer = this.add.container(centerX, buttonY);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-buttonWidth / 2 + 5, -buttonHeight / 2 + 5, buttonWidth, buttonHeight, 16);
    restartButtonContainer.add(shadow);

    const restartButton = this.add.graphics();
    const drawButton = (state) => {
      const colors = state === 'hover'
        ? [0x4CAF50, 0x4CAF50, 0x2E7D32, 0x2E7D32]
        : [0x43A047, 0x43A047, 0x1B5E20, 0x1B5E20];

      restartButton.clear();
      restartButton.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
      restartButton.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
      restartButton.lineStyle(4, 0xFFD700, 1);
      restartButton.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
    };

    drawButton('default');
    restartButtonContainer.add(restartButton);

    const restartText = this.add.text(
      0,
      0,
      'Начать заново',
      {
        fontSize: isMobile ? '32px' : '40px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#1B5E20',
        strokeThickness: 2
      }
    ).setOrigin(0.5);
    restartButtonContainer.add(restartText);

    const interactiveRect = new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight);
    restartButton.setInteractive(interactiveRect, Phaser.Geom.Rectangle.Contains);
    
    restartButton.on('pointerdown', () => {
      this.tweens.add({
        targets: restartButtonContainer,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.scene.start('GameScene', { mapIndex: 0 });
        }
      });
    });
    
    restartButton.on('pointerover', () => {
      drawButton('hover');
      this.tweens.add({
        targets: restartButtonContainer,
        scale: 1.05,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    restartButton.on('pointerout', () => {
      drawButton('default');
      this.tweens.add({
        targets: restartButtonContainer,
        scale: 1,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    // Анимация появления
    title.setAlpha(0);
    subtitle.setAlpha(0);
    restartButtonContainer.setAlpha(0);
    
    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
    });
    
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 1000,
      delay: 500,
      ease: 'Power2'
    });
    
    this.tweens.add({
      targets: restartButtonContainer,
      alpha: 1,
      duration: 1000,
      delay: 1000,
      ease: 'Power2'
    });
    
    // Постоянный салют
    this.createContinuousFireworks(width, height);
  }

  createContinuousFireworks(width, height) {
    const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
    
    const launchFirework = () => {
      const x = Phaser.Math.Between(width * 0.1, width * 0.9);
      const y = Phaser.Math.Between(height * 0.1, height * 0.5);
      const color = Phaser.Utils.Array.GetRandom(colors);
      
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(color, 1);
      graphics.fillCircle(0, 0, 5);
      graphics.generateTexture('particle_temp', 10, 10);
      graphics.destroy();
      
      const particles = this.add.particles(x, y, 'particle_temp', {
        speed: { min: 100, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        tint: color,
        lifespan: 1000,
        quantity: 40,
        blendMode: 'ADD'
      });
      
      this.time.delayedCall(1000, () => {
        particles.destroy();
      });
    };
    
    // Запускаем салют каждые 800мс
    this.time.addEvent({
      delay: 800,
      callback: launchFirework,
      loop: true
    });
    
    // Первый залп сразу
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, launchFirework);
    }
  }
}
