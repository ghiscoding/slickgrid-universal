export declare abstract class TranslaterService {
    /**
     * Method to return the current locale used by the App
     * @return {string} current locale
     */
    getCurrentLocale(): string;
    /**
     * Method to set the locale to use in the App
     * @param locale
     */
    setLocale(locale: string): Promise<any>;
    /**
     * Method which receives a translation key and returns the translated value from that key
     * @param {string} translation key
     * @return {string} translated value
     */
    translate(translationKey: string): string;
}
//# sourceMappingURL=translater.service.d.ts.map