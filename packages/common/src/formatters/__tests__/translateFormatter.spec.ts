
import { Column } from '../../interfaces/index';
import { translateFormatter } from '../translateFormatter';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

describe('the Translate Formatter', () => {
  let translateService: TranslateServiceStub;

  // stub some methods of the SlickGrid Grid instance
  const gridStub = {
    getOptions: jest.fn()
  };

  beforeEach(() => {
    translateService = new TranslateServiceStub();
  });

  it('should return an empty string when null value is passed', async () => {
    await translateService.setLocale('fr');
    gridStub.getOptions.mockReturnValueOnce({ i18n: translateService });
    const output = translateFormatter(1, 1, null, {} as Column, {}, gridStub);
    expect(translateService.getCurrentLocale()).toBe('fr');
    expect(output).toBe('');
  });

  it('should return an empty string when no value is passed', async () => {
    await translateService.setLocale('fr');
    jest.spyOn(translateService, 'translate').mockReturnValue('');
    gridStub.getOptions.mockReturnValueOnce({ i18n: translateService });
    const output = translateFormatter(1, 1, '', {} as Column, {}, gridStub);
    expect(translateService.getCurrentLocale()).toBe('fr');
    expect(output).toBe('');
  });

  it('should return the translated value as string', async () => {
    await translateService.setLocale('fr');
    jest.spyOn(translateService, 'translate').mockReturnValue('Bonjour');
    gridStub.getOptions.mockReturnValueOnce({ i18n: translateService });
    const output = translateFormatter(1, 1, 'HELLO', {} as Column, {}, gridStub);
    expect(output).toBe('Bonjour');
  });

  it('should return the translated value when value passed is a string and i18n service is passed as a ColumnDef Params', async () => {
    await translateService.setLocale('fr');
    jest.spyOn(translateService, 'translate').mockReturnValue('Bonjour');
    gridStub.getOptions.mockReturnValueOnce({});
    const output = translateFormatter(1, 1, 'HELLO', { params: { i18n: translateService } } as Column, {}, gridStub);
    expect(output).toBe('Bonjour');
  });

  it('should return the translated value when value passed is a string and i18n service is passed as a ColumnDef Params without any Grid object', async () => {
    await translateService.setLocale('fr');
    jest.spyOn(translateService, 'translate').mockReturnValue('Bonjour');
    const output = translateFormatter(1, 1, 'HELLO', { params: { i18n: translateService } } as Column, {});
    expect(output).toBe('Bonjour');
  });

  it('should convert any type of value to string', async () => {
    await translateService.setLocale('fr');
    gridStub.getOptions.mockReturnValueOnce({ i18n: translateService });
    const output = translateFormatter(1, 1, 99, {} as Column, {}, gridStub);
    expect(output).toBe('99');
  });

  it('should throw an error when no Translate service provided to neither ColumnDefinition and GridOptions', () => {
    gridStub.getOptions.mockReturnValueOnce({});
    expect(() => translateFormatter(1, 1, null, {} as Column, {}, gridStub)).toThrowError('formatter requires the Translate Service');
  });
});
