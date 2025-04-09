export type Callback = (error: any, t: Function) => void;

export interface I18Next {
  /**
   * Is set to the current detected or set language.
   * If you need the primary used language depending on your configuration (supportedLngs, load) you will prefer using i18next.languages[0].
   */
  language: string;

  /**
   * Changes the language. The callback will be called as soon translations were loaded or an error occurs while loading.
   * HINT: For easy testing - setting lng to 'cimode' will set t function to always return the key.
   */
  changeLanguage(lng?: string, callback?: Callback): Promise<Function>;

  /**
   * Gets fired when changeLanguage got called.
   */
  on(event: 'languageChanged', callback: (lng: string) => void): void;

  /**
   * Event listener
   */
  on(event: string, listener: (...args: any[]) => void): void;

  /**
   * Remove event listener
   * removes all callback when callback not specified
   */
  off(event: string, listener?: (...args: any[]) => void): void;

  // Expose parameterized t in the i18next interface hierarchy
  t(key: string, options?: any): string;
}
