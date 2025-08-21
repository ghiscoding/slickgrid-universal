import { beforeEach, describe, expect, it } from 'vitest';

import type { Column, GridOption } from '../../interfaces/index.js';
import { translateBooleanFormatter } from '../translateBooleanFormatter.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';

describe('the Translate Boolean Formatter', () => {
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
  });

  it('should return an empty string when null value is passed', async () => {
    await translateService.use('fr');
    const output = translateBooleanFormatter(1, 1, null, {} as Column, {}, { translater: translateService });
    expect(output).toBe('');
  });

  it('should return an empty string when empty string value is passed', async () => {
    await translateService.use('fr');
    const output = translateBooleanFormatter(1, 1, '', {} as Column, {}, { translater: translateService });
    expect(output).toBe('');
  });

  it('should return the translated value when value passed is boolean', async () => {
    await translateService.use('fr');
    const output = translateBooleanFormatter(1, 1, 'TRUE', {} as Column, {}, { translater: translateService });
    expect(output).toBe('Vrai');
  });

  it('should return the translated value when value passed is a string', async () => {
    await translateService.use('fr');
    const output = translateBooleanFormatter(1, 1, 'TRUE', {} as Column, {}, { translater: translateService } as GridOption);
    expect(output).toBe('Vrai');
  });

  it('should return the translated value when value passed is a string and translater service is passed as a ColumnDef Params', async () => {
    await translateService.use('fr');
    const output = translateBooleanFormatter(1, 1, 'TRUE', { params: { translater: translateService } } as Column, {}, {} as GridOption);
    expect(output).toBe('Vrai');
  });

  it('should return the translated value when value passed is a string and translater service is passed as a ColumnDef Params without any Grid object', async () => {
    await translateService.use('fr');
    const output = translateBooleanFormatter(1, 1, 'TRUE', { params: { translater: translateService } } as Column, {}, { translater: translateService });
    expect(output).toBe('Vrai');
  });

  it('should convert any type of value to string', async () => {
    await translateService.use('fr');
    const output = translateBooleanFormatter(1, 1, 99, {} as Column, {}, { translater: translateService });
    expect(output).toBe('99');
  });

  it('should throw an error when no Translate service is not provided to Column Definition and/or Grid Options', () => {
    expect(() => translateBooleanFormatter(1, 1, null, {} as Column, {}, {} as GridOption)).toThrow(
      '"Formatters.translateBoolean" requires the Translate Service'
    );
  });
});
