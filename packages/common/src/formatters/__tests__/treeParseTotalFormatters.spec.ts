import { Column, Formatter, GridOption } from '../../interfaces/index';
import { GroupTotalFormatters } from '../../grouping-formatters';
import { treeParseTotalsFormatter } from '../treeParseTotalsFormatter';
import { dollarFormatter } from '../dollarFormatter';
import { SlickGrid } from '../../core/index';

const gridStub = {
  getData: jest.fn(),
  getOptions: jest.fn(),
} as unknown as SlickGrid;

describe('TreeParseTotalFormatters', () => {
  let mockGridOptions: GridOption;
  const colFieldName = 'fileSize';
  const myItalicFormatter: Formatter = (_row, _cell, value) => value ? `<i>${value}</i>` : '';

  beforeEach(() => {
    mockGridOptions = {
      treeDataOptions: { levelPropName: 'indent' }
    } as GridOption;
    jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
  });

  it('should return expected output of groupTotalsFormatter when detecting the dataContext has tree children and a "__treeTotals" prop', () => {
    const cellValue = 2.1;
    const sumTotal = 12.33;
    const params = { formatters: [myItalicFormatter] };
    const result = treeParseTotalsFormatter(0, 0, cellValue, { field: colFieldName, groupTotalsFormatter: GroupTotalFormatters.sumTotalsBold, params } as Column, { __hasChildren: true, __treeTotals: { sum: { [colFieldName]: sumTotal } } }, gridStub);
    expect((result as HTMLElement).outerHTML).toBe(`<span style="font-weight: bold;">${sumTotal}</span>`);
  });

  it('should return expected output of treeTotalsFormatter when detecting the dataContext has tree children and a "__treeTotals" prop', () => {
    const cellValue = 2.1;
    const sumTotal = 12.33;
    const params = { formatters: [myItalicFormatter] };
    const result = treeParseTotalsFormatter(0, 0, cellValue, { field: colFieldName, treeTotalsFormatter: GroupTotalFormatters.sumTotalsBold, params } as Column, { __hasChildren: true, __treeTotals: { sum: { [colFieldName]: sumTotal } } }, gridStub);
    expect((result as HTMLElement).outerHTML).toBe(`<span style="font-weight: bold;">${sumTotal}</span>`);
  });

  it('should return expected output of italic formatter when detecting the dataContext does not has tree children, neither a "__treeTotals" prop', () => {
    const cellValue = 2.1;
    const params = { formatters: [myItalicFormatter] };
    const result = treeParseTotalsFormatter(0, 0, cellValue, { field: colFieldName, treeTotalsFormatter: GroupTotalFormatters.sumTotalsBold, params } as Column, {}, gridStub);
    expect(result).toBe(`<i>${cellValue}</i>`);
  });

  it('should return expected output of when multiple formatters (uppercase & italic) are provided and dataContext does not has tree children, neither a "__treeTotals" prop', () => {
    const cellValue = 2.1;
    const params = { formatters: [dollarFormatter, myItalicFormatter] };
    const result = treeParseTotalsFormatter(0, 0, cellValue, { field: colFieldName, treeTotalsFormatter: GroupTotalFormatters.sumTotalsBold, params } as Column, {}, gridStub);
    expect(result).toBe(`<i>$2.10</i>`);
  });

  it('should return same value as input when dataContext is not a tree total and params.formatters is not provided', () => {
    const cellValue = 2.1;
    const params = {};
    const result = treeParseTotalsFormatter(0, 0, cellValue, { field: colFieldName, treeTotalsFormatter: GroupTotalFormatters.sumTotalsBold, params } as Column, {}, gridStub);
    expect(result).toBe(cellValue);
  });

  it('should throw an error when this formatter is used without groupTotalsFormatter or treeTotalsFormatter', () => {
    const cellValue = 2.1;
    expect(() => treeParseTotalsFormatter(1, 1, cellValue, {} as Column, {}, gridStub))
      .toThrowError('[Slickgrid-Universal] When using Formatters.treeParseTotals, you must provide a total formatter via "groupTotalsFormatter" or "treeTotalsFormatter".');
  });
});
