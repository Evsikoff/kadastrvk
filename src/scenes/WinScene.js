import Phaser from 'phaser';
import { GameProgress } from '../utils/GameProgress.js';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    // Очищаем сохраненный прогресс при завершении всех уровней
    GameProgress.clearProgress();

    // Фон
    this.add.rectangle(960, 540, 1920, 1080, 0x1a1a2e);
    
    // Заголовок
    const title = this.add.text(
      960,
      300,
      'Поздравляем!',
      {
        fontSize: '96px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Подзаголовок
    const subtitle = this.add.text(
      960,
      450,
      'Вы прошли все уровни!',
      {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);
    
    // Кнопка рестарта
    const restartButton = this.add.rectangle(960, 650, 300, 80, 0x4CAF50)
      .setInteractive({ useHandCursor: true });
    
    const restartText = this.add.text(
      960,
      650,
      'Начать заново',
      {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);
    
    restartButton.on('pointerdown', () => {
      // Начинаем игру с первого уровня
      this.scene.start('GameScene', { mapIndex: 0 });
    });
    
    restartButton.on('pointerover', () => {
      restartButton.setFillStyle(0x45a049);
    });
    
    restartButton.on('pointerout', () => {
      restartButton.setFillStyle(0x4CAF50);
    });
    
    // Анимация появления
    title.setAlpha(0);
    subtitle.setAlpha(0);
    restartButton.setAlpha(0);
    restartText.setAlpha(0);
    
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
      targets: [restartButton, restartText],
      alpha: 1,
      duration: 1000,
      delay: 1000,
      ease: 'Power2'
    });
    
    // Постоянный салют
    this.createContinuousFireworks();
  }

  createContinuousFireworks() {
    const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
    
    const launchFirework = () => {
      const x = Phaser.Math.Between(300, 1620);
      const y = Phaser.Math.Between(150, 400);
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
