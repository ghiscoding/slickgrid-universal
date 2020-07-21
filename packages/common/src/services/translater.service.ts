export abstract class TranslaterService {
  /**
   * Method to return the current locale used by the App
   * @return {string} current locale
   */
  getCurrentLanguage(): string {
    throw new Error('TranslaterService "getCurrentLanguage" method must be implemented');
  }

  /**
   * Method to set the locale to use in the App
   * @param locale
   */
  use(locale: string): Promise<any> | any {
    throw new Error('TranslaterService "use" method must be implemented');
  }

  /**
   * Method which receives a translation key and returns the translated value from that key
   * @param {string} translation key
   * @return {string} translated value
   */
  translate(translationKey: string): string {
    throw new Error('TranslaterService "translate" method must be implemented');
  }
}
