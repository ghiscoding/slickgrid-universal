import { PubSubService } from '../pubSub.service';
import { TranslaterService } from '../translater.service';

describe('Translater Service', () => {
  it('should display a not implemented when calling "addPubSubMessaging" method', () => {
    expect(() => TranslaterService.prototype.addPubSubMessaging!({} as unknown as PubSubService)).toThrow('TranslaterService "addPubSubMessaging" method must be implemented');
  });

  it('should display a not implemented when calling "getCurrentLanguage" method', () => {
    expect(() => TranslaterService.prototype.getCurrentLanguage()).toThrow('TranslaterService "getCurrentLanguage" method must be implemented');
  });

  it('should display a not implemented when calling "use" method', () => {
    expect(() => TranslaterService.prototype.use('fr')).toThrow('TranslaterService "use" method must be implemented');
  });

  it('should display a not implemented when calling "translate" method', () => {
    expect(() => TranslaterService.prototype.translate('fr')).toThrow('TranslaterService "translate" method must be implemented');
  });
});
