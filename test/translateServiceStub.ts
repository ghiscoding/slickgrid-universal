import { TranslaterService } from '../packages/common/src/services/translater.service';

export class TranslateServiceStub implements TranslaterService {
  _locale = 'en';
  getCurrentLocale(): string {
    return this._locale;
  }
  translate(translationKey: string): string {
    let output = translationKey;
    switch (translationKey) {
      case 'CANCEL': output = this._locale === 'en' ? 'Cancel' : 'Annuler'; break;
      case 'HELLO': output = this._locale === 'en' ? 'Hello' : 'Bonjour'; break;
      case 'SAVE': output = this._locale === 'en' ? 'Save' : 'Sauvegarder'; break;
      case 'TRUE': output = this._locale === 'en' ? 'True' : 'Vrai'; break;
    }
    return output;
  }
  setLocale(locale: string) {
    return new Promise(resolve => resolve(this._locale = locale));
  }
}
