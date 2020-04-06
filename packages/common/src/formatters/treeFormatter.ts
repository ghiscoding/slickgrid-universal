import { Column, Formatter } from './../interfaces/index';

export const treeFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid: any) => {
  const treeLevelPropName = columnDef.treeData?.levelPropName || '__treeLevel';
  const indentMarginLeft = columnDef.treeData?.indentMarginLeft || 15;
  const dataView = grid && grid.getData();

  if (value === null || value === undefined || dataContext === undefined) {
    return '';
  }

  if (!dataContext.hasOwnProperty(treeLevelPropName)) {
    throw new Error('You must provide a valid Tree Data column, it seems that there are no tree level found in this row');
  }

  if (dataView && dataView.getIdxById && dataView.getItemByIdx) {
    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const identifierPropName = dataView.getIdPropertyName() || 'id';
    const spacer = `<span style="display:inline-block; width:${indentMarginLeft * dataContext[treeLevelPropName]}px;"></span>`;
    const idx = dataView.getIdxById(dataContext[identifierPropName]);
    const nextItemRow = dataView.getItemByIdx(idx + 1);

    if (nextItemRow && nextItemRow[treeLevelPropName] > dataContext[treeLevelPropName]) {
      if (dataContext.__collapsed) {
        return `${spacer}<span class="slick-group-toggle collapsed"></span>&nbsp;${value}`;
      } else {
        return `${spacer}<span class="slick-group-toggle expanded"></span>&nbsp;${value}`;
      }
    }
    return `${spacer}<span class="slick-group-toggle"></span>&nbsp;${value}`;
  }
  return '';
};
