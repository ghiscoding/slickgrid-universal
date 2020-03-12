import { TranslaterService } from '@slickgrid-universal/common';


export class TranslateService implements TranslaterService {
  getCurrentLocale(): string {
    return 'en';
  }

  setLocale(locale: string): Promise<any> {
    return new Promise((resolve) => resolve(locale));
  }

  translate(translationKey: string): string {
    return translationKey;
  }
}
