import { TranslaterService } from '../src/services/translater.service';

export class TranslateServiceStub implements TranslaterService {
  _locale = 'en';
  getCurrentLocale(): string {
    return this._locale;
  }
  translate(translationKey: string): string {
    return translationKey;
  }
  setLocale(locale: string) {
    return new Promise(resolve => resolve(this._locale = locale));
  }
}
