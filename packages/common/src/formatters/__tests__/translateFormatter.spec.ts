import { beforeEach, describe, expect, it } from 'vitest';

import type { Column, GridOption } from '../../interfaces/index.js';
import { translateFormatter } from '../translateFormatter.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';

describe('the Translate Formatter', () => {
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
  });

  it('should return an empty string when null value is passed', async () => {
    await translateService.use('fr');
    const output = translateFormatter(1, 1, null, {} as Column, {}, { translater: translateService });
    expect(translateService.getCurrentLanguage()).toBe('fr');
    expect(output).toBe('');
  });

  it('should return an empty string when no value is passed', async () => {
    await translateService.use('fr');
    const output = translateFormatter(1, 1, '', {} as Column, {}, { translater: translateService });
    expect(translateService.getCurrentLanguage()).toBe('fr');
    expect(output).toBe('');
  });

  it('should return the translated value as string', async () => {
    await translateService.use('fr');
    const output = translateFormatter(1, 1, 'HELLO', {} as Column, {}, { translater: translateService });
    expect(output).toBe('Bonjour');
  });

  it('should return the translated value when value passed is a string and translater service is passed as a ColumnDef Params', async () => {
    await translateService.use('fr');
    const output = translateFormatter(1, 1, 'HELLO', { params: { translater: translateService } } as Column, {}, {} as GridOption);
    expect(output).toBe('Bonjour');
  });

  it('should return the translated value when value passed is a string and translater service is passed as a ColumnDef Params without any Grid object', async () => {
    await translateService.use('fr');
    const output = translateFormatter(1, 1, 'HELLO', { params: { translater: translateService } } as Column, {}, { translater: translateService });
    expect(output).toBe('Bonjour');
  });

  it('should convert any type of value to string', async () => {
    await translateService.use('fr');
    const output = translateFormatter(1, 1, 99, {} as Column, {}, { translater: translateService });
    expect(output).toBe('99');
  });

  it('should throw an error when no Translate service provided to neither ColumnDefinition and GridOptions', () => {
    expect(() => translateFormatter(1, 1, null, {} as Column, {}, {} as GridOption)).toThrow('"Formatters.translate" requires the Translate Service');
  });
});
