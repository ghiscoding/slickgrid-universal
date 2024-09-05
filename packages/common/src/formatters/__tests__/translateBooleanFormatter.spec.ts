import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { Column } from '../../interfaces/index';
import { translateBooleanFormatter } from '../translateBooleanFormatter';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import type { SlickGrid } from '../../core';

describe('the Translate Boolean Formatter', () => {
  let translateService: TranslateServiceStub;

  // stub some methods of the SlickGrid Grid instance
  const gridStub = {
    getOptions: vi.fn()
  } as unknown as SlickGrid;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
  });

  it('should return an empty string when null value is passed', async () => {
    await translateService.use('fr');
    (gridStub.getOptions as Mock).mockReturnValueOnce({ translater: translateService });
    const output = translateBooleanFormatter(1, 1, null, {} as Column, {}, gridStub);
    expect(output).toBe('');
  });

  it('should return an empty string when empty string value is passed', async () => {
    await translateService.use('fr');
    (gridStub.getOptions as Mock).mockReturnValueOnce({ translater: translateService });
    const output = translateBooleanFormatter(1, 1, '', {} as Column, {}, gridStub);
    expect(output).toBe('');
  });

  it('should return the translated value when value passed is boolean', async () => {
    await translateService.use('fr');
    (gridStub.getOptions as Mock).mockReturnValueOnce({ translater: translateService });
    const output = translateBooleanFormatter(1, 1, 'TRUE', {} as Column, {}, gridStub);
    expect(output).toBe('Vrai');
  });

  it('should return the translated value when value passed is a string', async () => {
    await translateService.use('fr');
    (gridStub.getOptions as Mock).mockReturnValueOnce({ translater: translateService });
    const output = translateBooleanFormatter(1, 1, 'TRUE', {} as Column, {}, gridStub);
    expect(output).toBe('Vrai');
  });

  it('should return the translated value when value passed is a string and translater service is passed as a ColumnDef Params', async () => {
    await translateService.use('fr');
    (gridStub.getOptions as Mock).mockReturnValueOnce({});
    const output = translateBooleanFormatter(1, 1, 'TRUE', { params: { translater: translateService } } as Column, {}, gridStub);
    expect(output).toBe('Vrai');
  });

  it('should return the translated value when value passed is a string and translater service is passed as a ColumnDef Params without any Grid object', async () => {
    await translateService.use('fr');
    const output = translateBooleanFormatter(1, 1, 'TRUE', { params: { translater: translateService } } as Column, {}, gridStub);
    expect(output).toBe('Vrai');
  });

  it('should convert any type of value to string', async () => {
    await translateService.use('fr');
    (gridStub.getOptions as Mock).mockReturnValueOnce({ translater: translateService });
    const output = translateBooleanFormatter(1, 1, 99, {} as Column, {}, gridStub);
    expect(output).toBe('99');
  });

  it('should throw an error when no Translate service is not provided to Column Definition and/or Grid Options', () => {
    (gridStub.getOptions as Mock).mockReturnValueOnce({});
    expect(() => translateBooleanFormatter(1, 1, null, {} as Column, {}, gridStub)).toThrow('"Formatters.translateBoolean" requires the Translate Service');
  });
});
