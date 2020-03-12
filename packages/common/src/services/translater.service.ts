export abstract class TranslaterService {
  /**
   * Method to return the current locale used by the App
   * @return {string} current locale
   */
  getCurrentLocale(): string {
    console.log('TranslaterService "getCurrentLocale" method must be implemented');
    return 'en';
  }


  /**
   * Method to set the locale to use in the App
   * @param locale
   */
  setLocale(locale: string): Promise<any> {
    return new Promise((resolve) => resolve(locale));
  }

  /**
   * Method which receives a translation key and returns the translated value from that key
   * @param {string} translation key
   * @return {string} translated value
   */
  translate(translationKey: string): string {
    console.log('TranslaterService "translate" method must be implemented');
    return translationKey;
  }
}
