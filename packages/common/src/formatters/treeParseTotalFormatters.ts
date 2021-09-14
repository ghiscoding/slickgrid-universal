import { Constants } from '../constants';
import { Formatter, GridOption, GroupTotalsFormatter } from './../interfaces/index';

export const treeParseTotalFormatters: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  const gridOptions = grid.getOptions() as GridOption;
  const hasChildrenPropName = gridOptions?.treeDataOptions?.hasChildrenPropName ?? Constants.treeDataProperties.HAS_CHILDREN_PROP;
  const params = columnDef.params || {};

  if (params.formatters) {
    const formatters: Array<Formatter | GroupTotalsFormatter> = params.formatters;

    // loop through all Formatters, the value of 1st formatter will be used by 2nd formatter and so on.
    // they are piped and executed in sequences
    let currentValue = value;
    for (const formatter of formatters) {
      if (formatter.length === 3 && dataContext[hasChildrenPropName] && dataContext?.__treeTotals) {
        currentValue = (formatter as GroupTotalsFormatter).call(this, dataContext?.__treeTotals, columnDef, grid);
      } else if (!dataContext[hasChildrenPropName] && !dataContext?.__treeTotals && !formatter.name.includes('Totals')) {
        currentValue = (formatter as Formatter)(row, cell, value, columnDef, dataContext, grid) || value;
      }
    }
    return currentValue;
  }
  return value;
};
