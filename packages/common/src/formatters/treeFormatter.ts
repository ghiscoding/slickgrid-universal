import { Column, Formatter } from './../interfaces/index';

export const treeFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid: any) => {
  const treeLevelPropName = columnDef.treeView?.levelPropName || '__treeLevel';
  const indentMarginLeft = columnDef.treeView?.indentMarginLeft || 15;
  const dataView = grid.getData();

  if (!dataContext.hasOwnProperty(treeLevelPropName)) {
    throw new Error('You must provide a valid Tree View column, it seems that there are no tree level found in this row');
  }
  if (dataView && dataView.getIdxById && dataView.getItemByIdx) {
    if (value === null || value === undefined || dataContext === undefined) { return ''; }
    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span style="display:inline-block;height:1px;width:${indentMarginLeft * dataContext[treeLevelPropName]}px"></span>`;
    const idx = dataView.getIdxById(dataContext.id);
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
