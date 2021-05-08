import { SlickDataView, Formatter } from './../interfaces/index';
import { getDescendantProperty, sanitizeTextByAvailableSanitizer } from '../services/utilities';

/** Formatter that must be use with a Tree Data column */
export const treeFormatter: Formatter = (_row, _cell, value, columnDef, dataContext, grid) => {
  const dataView = grid.getData<SlickDataView>();
  const gridOptions = grid.getOptions();
  const treeDataOptions = gridOptions?.treeDataOptions;
  const treeLevelPropName = treeDataOptions?.levelPropName ?? '__treeLevel';
  const indentMarginLeft = treeDataOptions?.indentMarginLeft ?? 15;
  let outputValue = value;

  if (typeof columnDef.queryFieldNameGetterFn === 'function') {
    const fieldName = columnDef.queryFieldNameGetterFn(dataContext);
    if (fieldName?.indexOf('.') >= 0) {
      outputValue = getDescendantProperty(dataContext, fieldName);
    } else {
      outputValue = dataContext.hasOwnProperty(fieldName) ? dataContext[fieldName] : value;
    }
  }
  if (outputValue === null || outputValue === undefined || dataContext === undefined) {
    return '';
  }

  if (!dataContext.hasOwnProperty(treeLevelPropName)) {
    throw new Error('[Slickgrid-Universal] You must provide valid "treeDataOptions" in your Grid Options, however it seems that we could not find any tree level info on the current item datacontext row.');
  }

  if (dataView?.getItemByIdx) {
    const sanitizedOutputValue = sanitizeTextByAvailableSanitizer(gridOptions, outputValue);
    const identifierPropName = dataView.getIdPropertyName() ?? 'id';
    const treeLevel = dataContext[treeLevelPropName] || 0;
    const spacer = `<span style="display:inline-block; width:${indentMarginLeft * treeLevel}px;"></span>`;
    const idx = dataView.getIdxById(dataContext[identifierPropName]);
    const nextItemRow = dataView.getItemByIdx((idx || 0) + 1);

    if (nextItemRow?.[treeLevelPropName] > treeLevel) {
      if (dataContext.__collapsed) {
        return `${spacer}<span class="slick-group-toggle collapsed"></span>&nbsp;${sanitizedOutputValue}`;
      } else {
        return `${spacer}<span class="slick-group-toggle expanded"></span>&nbsp;${sanitizedOutputValue}`;
      }
    }
    return `${spacer}<span class="slick-group-toggle"></span>&nbsp;${sanitizedOutputValue}`;
  }
  return '';
};
