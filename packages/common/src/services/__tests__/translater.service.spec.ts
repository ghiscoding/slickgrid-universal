import { TranslaterService } from '../translater.service';

describe('Export Service', () => {
  it('should display a not implemented when calling "getCurrentLocale" method', () => {
    expect(() => TranslaterService.prototype.getCurrentLocale()).toThrow('TranslaterService "getCurrentLocale" method must be implemented');
  });

  it('should display a not implemented when calling "setLocale" method', () => {
    expect(() => TranslaterService.prototype.setLocale('fr')).toThrow('TranslaterService "setLocale" method must be implemented');
  });

  it('should display a not implemented when calling "translate" method', () => {
    expect(() => TranslaterService.prototype.translate('fr')).toThrow('TranslaterService "translate" method must be implemented');
  });
});
