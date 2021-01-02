import { getDescendantProperty, PubSubService, TranslaterService, TranslateServiceEventName } from '@slickgrid-universal/common';
import { fetch } from 'whatwg-fetch';

interface Locales {
  [locale: string]: string;
}

interface TranslateOptions {
  loadPath: string;
  lang: string;
}

export class TranslateService implements TranslaterService {
  eventName = 'onLanguageChange' as TranslateServiceEventName;
  private _currentLanguage = 'en';
  private _locales: { [language: string]: Locales } = {};
  private _pubSubServices: PubSubService[] = [];
  private _options;

  /**
   * Add an optional Pub/Sub Messaging Service,
   * when defined the Translate Service will call the publish method with "onLanguageChanged" event name whenever the "use()" method is called
   * @param {PubSubService} pubSub
   */
  addPubSubMessaging(pubSubService: PubSubService) {
    this._pubSubServices.push(pubSubService);
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

  async use(newLang: string): Promise<Locales> {
    this._currentLanguage = newLang;

    // if it's already loaded in the cache, then resolve the locale set, else fetch it
    if (this._locales?.hasOwnProperty(newLang)) {
      this.publishLanguageChangeEvent(newLang);
      return Promise.resolve(this._locales[newLang]);
    }

    const path = this._options.loadPath.replace(/{{lang}}/gi, newLang);
    const localeSet = await this.fetchLocales(path, newLang);
    this.publishLanguageChangeEvent(newLang);

    return localeSet;
  }

  setup(options: TranslateOptions) {
    this._options = options;
  }

  translate(translationKey: string): string {
    let translatedText = '';
    if (this._locales?.hasOwnProperty(this._currentLanguage)) {
      translatedText = getDescendantProperty(this._locales[this._currentLanguage], translationKey);
    }
    return translatedText || translationKey;
  }

  private publishLanguageChangeEvent(newLanguage: string) {
    for (const pubSub of this._pubSubServices) {
      pubSub.publish(this.eventName, { language: newLanguage });
    }
  }
}
