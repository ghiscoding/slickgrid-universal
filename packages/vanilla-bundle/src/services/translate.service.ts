import { TranslaterService } from '@slickgrid-universal/common';

export class TranslateService implements TranslaterService {
  private _currentLocale = 'en';

  getCurrentLocale(): string {
    return this._currentLocale;
  }

  setLocale(locale: string): Promise<string> {
    this._currentLocale = locale;
    return new Promise((resolve) => resolve(this._currentLocale));
  }

  translate(translationKey: string): string {
    // TODO implement translation with `translations = require(jsonFilePath)`, then use `translations[translationKey]`
    return translationKey;
  }
}
