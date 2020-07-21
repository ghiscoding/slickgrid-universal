import { TranslaterService, getDescendantProperty } from '@slickgrid-universal/common';
import * as fetch from 'isomorphic-fetch';
import * as e6p from 'es6-promise';

interface Locales {
  [locale: string]: string;
}

interface TranslateOptions {
  loadPath: string;
  lang: string;
}

export class TranslateService implements TranslaterService {
  private _currentLanguage = 'en';
  private _locales: { [language: string]: Locales } = {};
  private _options;

  constructor() {
    (e6p as any).polyfill();
  }

  getCurrentLanguage(): string {
    return this._currentLanguage;
  }

  fetchLocales(loadPath: string, language: string): Promise<Locales> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(loadPath);
        if (!response.ok) {
          throw new Error(`HTTP Fetch error ${response.status}`);
        }
        const localeSet = await response.json();
        this._locales[language] = localeSet;
        resolve(localeSet);
      } catch (error) {
        console.log('fetch error', error);
        reject(error);
      }
    });
  }

  use(language: string): Promise<Locales> {
    this._currentLanguage = language;

    // if it's already loaded in the cache, then resolve the locale set, else fetch it
    if (this._locales?.hasOwnProperty(language)) {
      return Promise.resolve(this._locales[language]);
    }

    const path = this._options.loadPath.replace(/{{lang}}/gi, language);
    return this.fetchLocales(path, language);
  }

  setup(options: TranslateOptions) {
    this._options = options;
  }

  translate(translationKey: string): string {
    if (this._locales?.hasOwnProperty(this._currentLanguage)) {
      return getDescendantProperty(this._locales[this._currentLanguage], translationKey);
    }
    return translationKey;
  }
}
