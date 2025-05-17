import type { TranslaterService as UniversalTranslateService } from '@slickgrid-universal/common';
import { I18N } from '@aurelia/i18n';
import { inject, optional } from 'aurelia';

/**
 * This is a Translate Service Wrapper for Slickgrid-Universal monorepo lib to work properly,
 * it must implement Slickgrid-Universal TranslaterService interface to work properly
 */
@inject(optional(I18N))
export class TranslaterService implements UniversalTranslateService {
  constructor(private readonly i18n: I18N) {}

  /**
   * Method to return the current language used by the App
   * @return {string} current language
   */
  getCurrentLanguage(): string {
    return this.i18n?.getLocale() || '';
  }

  /**
   * Method to set the language to use in the App and Translate Service
   * @param {string} language
   * @return {Promise} output
   */
  async use(newLang: string): Promise<any> {
    return this.i18n?.setLocale(newLang);
  }

  /**
   * Method which receives a translation key and returns the translated value assigned to that key
   * @param {string} translation key
   * @return {string} translated value
   */
  translate(translationKey: string): string {
    return this.i18n?.tr(translationKey) || '';
  }
}
