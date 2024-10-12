import { Constants } from '../constants.js';
import type { Formatter, GridOption, GroupTotalsFormatter } from '../interfaces/index.js';

export const treeParseTotalsFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  const gridOptions = grid.getOptions() as GridOption;
  const hasChildrenPropName = gridOptions?.treeDataOptions?.hasChildrenPropName ?? Constants.treeDataProperties.HAS_CHILDREN_PROP;
  const { groupTotalsFormatter, treeTotalsFormatter, params } = columnDef;

  // make sure that the user provided a total formatter or else it won't work
  if (!groupTotalsFormatter && !treeTotalsFormatter) {
    throw new Error('[Slickgrid-Universal] When using Formatters.treeParseTotals, you must provide a total formatter via "groupTotalsFormatter" or "treeTotalsFormatter".');
  }

  // treeParseTotalsFormatter will auto-detect if it should execute GroupTotalsFormatter or a list of regular Formatters (it has to be either/or, never both at same time)
  if (dataContext[hasChildrenPropName] && dataContext?.__treeTotals && (groupTotalsFormatter || treeTotalsFormatter)) {
    const totalFormatter = (treeTotalsFormatter ?? groupTotalsFormatter) as GroupTotalsFormatter;
    return totalFormatter(dataContext?.__treeTotals, columnDef, grid);
  } else if (params.formatters) {
    // loop through all Formatters, the value of 1st formatter will be used by 2nd formatter and so on.
    // they are piped and executed in sequences
    let currentValue = value;
    for (const formatter of params.formatters) {
      if (!dataContext[hasChildrenPropName] && !dataContext?.__treeTotals && typeof formatter === 'function') {
        currentValue = (formatter as Formatter)(row, cell, currentValue, columnDef, dataContext, grid) || value;
      }
    }
    return currentValue;
  }

  // falling here means dataContext doesn't include any tree totals and user didn't provide any regular formatters
  return value;
};
