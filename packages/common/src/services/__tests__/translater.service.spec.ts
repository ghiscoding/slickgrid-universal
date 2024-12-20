import { describe, expect, it } from 'vitest';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import { TranslaterService } from '../translater.service.js';

describe('Translater Service', () => {
  it('should display a not implemented when calling "addPubSubMessaging" method', () => {
    expect(() => TranslaterService.prototype.addPubSubMessaging!({} as unknown as BasePubSubService)).toThrow(
      'TranslaterService "addPubSubMessaging" method must be implemented'
    );
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
