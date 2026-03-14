import bridge from '@vkontakte/vk-bridge';

// Utility class for VK Bridge integration
export class VKBridge {
  static isInitialized = false;
  static adsPreloaded = false;

  /**
   * Unified sender with request/response logging
   * @param {string} method
   * @param {Object} params
   * @returns {Promise<any>}
   */
  static async send(method, params = {}) {
    console.log(`📨 VK Bridge request: ${method}`, params);

    try {
      const response = await bridge.send(method, params);
      console.log(`📬 VK Bridge response: ${method}`, response);
      return response;
    } catch (error) {
      console.warn(`❌ VK Bridge error: ${method}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to VK Bridge events
   * @param {Function} callback - Event handler
   */
  static subscribe(callback) {
    bridge.subscribe((event) => {
      console.log('📡 VK Bridge event:', event.detail?.type, event.detail?.data ?? {});
      callback(event);
    });
  }

  /**
   * Initialize VK Bridge
   */
  static async init() {
    try {
      await this.send('VKWebAppInit');
      this.isInitialized = true;
      console.log('VK Bridge initialized');
      return true;
    } catch (error) {
      console.warn('Failed to initialize VK Bridge:', error);
      return false;
    }
  }

  /**
   * Get value from VK Storage
   * @param {string} key - Storage key
   * @returns {Promise<string|null>} - Value or null if not found
   */
  static async getStorageValue(key) {
    if (!this.isInitialized) {
      console.warn('VK Bridge is not initialized');
      return null;
    }

    try {
      const result = await this.send('VKWebAppStorageGet', {
        keys: [key]
      });

      if (result.keys && result.keys.length > 0) {
        return result.keys[0].value || null;
      }

      return null;
    } catch (error) {
      console.warn('Failed to get value from VK Storage:', error);
      return null;
    }
  }

  /**
   * Set value in VK Storage
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   * @returns {Promise<boolean>} - Success status
   */
  static async setStorageValue(key, value) {
    if (!this.isInitialized) {
      console.warn('VK Bridge is not initialized');
      return false;
    }

    try {
      await this.send('VKWebAppStorageSet', {
        key: key,
        value: value.toString()
      });
      return true;
    } catch (error) {
      console.warn('Failed to set value in VK Storage:', error);
      return false;
    }
  }

  /**
   * Preload reward ads
   * @returns {Promise<boolean>} - Success status
   */
  static async preloadRewardAd() {
    if (!this.isInitialized) {
      console.warn('VK Bridge is not initialized');
      return false;
    }

    try {
      const result = await this.send('VKWebAppCheckNativeAds', {
        ad_format: 'reward'
      });
      this.adsPreloaded = result.result;
      console.log('Reward ads preloaded:', result.result);
      return result.result;
    } catch (error) {
      console.warn('Failed to preload reward ads:', error);
      return false;
    }
  }

  /**
   * Show reward ad
   * @returns {Promise<boolean>} - Success status (true if ad was shown and user watched it)
   */
  static async showRewardAd() {
    if (!this.isInitialized) {
      console.warn('VK Bridge is not initialized');
      return false;
    }

    try {
      const result = await this.send('VKWebAppShowNativeAds', {
        ad_format: 'reward'
      });
      console.log('Reward ad result:', result);
      return result.result;
    } catch (error) {
      console.warn('Failed to show reward ad:', error);
      return false;
    }
  }

  /**
   * Show interstitial ad
   * @returns {Promise<boolean>} - Success status
   */
  static async showInterstitialAd() {
    if (!this.isInitialized) {
      console.warn('VK Bridge is not initialized');
      return false;
    }

    try {
      const result = await this.send('VKWebAppShowNativeAds', {
        ad_format: 'interstitial'
      });
      console.log('Interstitial ad result:', result);
      return result.result;
    } catch (error) {
      console.warn('Failed to show interstitial ad:', error);
      return false;
    }
  }

  /**
   * Get iFrame client rect from VK host if available
   * @returns {Promise<{width:number,height:number,left?:number,top?:number}|null>}
   */
  static async getClientRect() {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const result = await this.send('VKWebAppGetClientRect');
      if (typeof result?.width === 'number' && typeof result?.height === 'number') {
        return result;
      }
    } catch (error) {
      console.warn('Failed to get VK client rect:', error);
    }

    return null;
  }
}
