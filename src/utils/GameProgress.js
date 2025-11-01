import { VKBridge } from './VKBridge.js';

// Utility class for managing game progress in localStorage and VK Storage
export class GameProgress {
  static STORAGE_KEY = 'kadastr_game_level';
  static MAX_LEVEL_KEY = 'kadastr_max_level';

  /**
   * Save the current level to both localStorage and VK Storage
   * @param {number} level - The current level index (0-based)
   */
  static async saveLevel(level) {
    // Save to localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, level.toString());
    } catch (error) {
      console.warn('Failed to save game progress to localStorage:', error);
    }

    // Save to VK Storage
    await VKBridge.setStorageValue(this.STORAGE_KEY, level.toString());

    // Update max level if current level is higher
    const maxLevel = await this.getMaxLevel();
    if (maxLevel === null || level > maxLevel) {
      await this.saveMaxLevel(level);
    }
  }

  /**
   * Load the saved level from VK Storage first, then fallback to localStorage
   * @returns {Promise<number|null>} - The saved level index or null if not found
   */
  static async loadLevel() {
    // Try to load from VK Storage first
    try {
      const vkLevel = await VKBridge.getStorageValue(this.STORAGE_KEY);
      if (vkLevel !== null && vkLevel !== '') {
        const level = parseInt(vkLevel, 10);
        if (!isNaN(level)) {
          return level;
        }
      }
    } catch (error) {
      console.warn('Failed to load game progress from VK Storage:', error);
    }

    // Fallback to localStorage
    try {
      const savedLevel = localStorage.getItem(this.STORAGE_KEY);
      if (savedLevel !== null) {
        const level = parseInt(savedLevel, 10);
        return isNaN(level) ? null : level;
      }
      return null;
    } catch (error) {
      console.warn('Failed to load game progress from localStorage:', error);
      return null;
    }
  }

  /**
   * Save the maximum reached level
   * @param {number} level - The maximum level index (0-based)
   */
  static async saveMaxLevel(level) {
    // Save to localStorage
    try {
      localStorage.setItem(this.MAX_LEVEL_KEY, level.toString());
    } catch (error) {
      console.warn('Failed to save max level to localStorage:', error);
    }

    // Save to VK Storage
    await VKBridge.setStorageValue(this.MAX_LEVEL_KEY, level.toString());
  }

  /**
   * Get the maximum reached level from VK Storage or localStorage
   * @returns {Promise<number|null>} - The maximum level or null if not found
   */
  static async getMaxLevel() {
    // Try to load from VK Storage first
    try {
      const vkMaxLevel = await VKBridge.getStorageValue(this.MAX_LEVEL_KEY);
      if (vkMaxLevel !== null && vkMaxLevel !== '') {
        const level = parseInt(vkMaxLevel, 10);
        if (!isNaN(level)) {
          return level;
        }
      }
    } catch (error) {
      console.warn('Failed to load max level from VK Storage:', error);
    }

    // Fallback to localStorage
    try {
      const savedMaxLevel = localStorage.getItem(this.MAX_LEVEL_KEY);
      if (savedMaxLevel !== null) {
        const level = parseInt(savedMaxLevel, 10);
        return isNaN(level) ? null : level;
      }
      return null;
    } catch (error) {
      console.warn('Failed to load max level from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear the saved progress from both localStorage and VK Storage
   */
  static async clearProgress() {
    // Clear from localStorage
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.MAX_LEVEL_KEY);
    } catch (error) {
      console.warn('Failed to clear game progress from localStorage:', error);
    }

    // Clear from VK Storage
    await VKBridge.setStorageValue(this.STORAGE_KEY, '');
    await VKBridge.setStorageValue(this.MAX_LEVEL_KEY, '');
  }

  /**
   * Check if there is saved progress
   * @returns {Promise<boolean>}
   */
  static async hasSavedProgress() {
    const level = await this.loadLevel();
    return level !== null;
  }
}
