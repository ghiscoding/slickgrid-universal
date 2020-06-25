import { TranslateService } from '../translate.service';

describe('Export Service', () => {
  let service: TranslateService;

  beforeEach(() => {
    service = new TranslateService();
  });

  it('should return "en" when calling "getCurrentLocale" method', () => {
    const output = service.getCurrentLocale();
    expect(output).toBe('en');
  });

  it('should return a promise with same locale returned as the one passed as argument', async () => {
    const output = await service.setLocale('fr');
    expect(output).toBe('fr');
  });

  it('should return same translation as argument provided', () => {
    const output = service.translate('HELLO');
    expect(output).toBe('HELLO');
  });
});
