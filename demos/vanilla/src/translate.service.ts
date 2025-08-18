import {
  getDescendantProperty,
  type PubSubService,
  type TranslaterService,
  type TranslateServiceEventName,
} from '@slickgrid-universal/common';

interface Locales {
  [locale: string]: string;
}

interface TranslateOptions {
  loadPath: string;
  lang: string;
}

export class TranslateService implements TranslaterService {
  eventName = 'onLanguageChange' as TranslateServiceEventName;
  protected _currentLanguage = 'en';
  protected _locales: { [language: string]: Locales } = {};
  protected _pubSubServices: PubSubService[] = [];
  protected _options;
  protected templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;

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

  isDefined(value) {
    return typeof value !== 'undefined' && value !== null;
  }

  /**
   * interpolate a string that could have token(s) and replace them with their corresponding values provided as object argument(s).
   * @param expr
   * @param params
   * @returns
   */
  interpolateString(expr, params) {
    if (!params) {
      return expr;
    }

    return expr.replace(this.templateMatcher, (substring, b) => {
      const r = this.getValue(params, b);
      return this.isDefined(r) ? r : substring;
    });
  }

  getValue(target, key) {
    const keys = typeof key === 'string' ? key.split('.') : [key];
    key = '';
    do {
      key += keys.shift();
      if (this.isDefined(target) && this.isDefined(target[key]) && (typeof target[key] === 'object' || !keys.length)) {
        target = target[key];
        key = '';
      } else if (!keys.length) {
        target = undefined;
      } else {
        key += '.';
      }
    } while (keys.length);

    return target;
  }

  async use(newLang: string): Promise<Locales> {
    const hasLangChanged = this._currentLanguage !== newLang;
    this._currentLanguage = newLang;

    // if it's already loaded in the cache, then resolve the locale set, else fetch it
    if (this._locales?.hasOwnProperty(newLang)) {
      if (hasLangChanged) {
        this.publishLanguageChangeEvent(newLang);
      }
      return Promise.resolve(this._locales[newLang]);
    }

    const path = this._options.loadPath.replace(/{{lang}}/gi, newLang);
    const localeSet = await this.fetchLocales(path, newLang);
    if (hasLangChanged) {
      this.publishLanguageChangeEvent(newLang);
    }

    return localeSet;
  }

  setup(options: TranslateOptions) {
    this._options = options;
  }

  translate(translationKey: string, params?: any): string {
    let translatedText = '';
    if (this._locales?.hasOwnProperty(this._currentLanguage)) {
      translatedText = getDescendantProperty(this._locales[this._currentLanguage], translationKey);
    }
    return this.interpolateString(translatedText || translationKey, params);
  }

  private publishLanguageChangeEvent(newLanguage: string) {
    for (const pubSub of this._pubSubServices) {
      pubSub.publish(this.eventName, { language: newLanguage });
    }
  }
}
