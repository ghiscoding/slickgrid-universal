import { createDomElement } from '@slickgrid-universal/utils';
import { applyHtmlToElement } from '../core/utils.js';
import { createDocumentFragmentOrElement, getCellValueFromQueryFieldGetter, getTreeDataPropNames } from '../services/utilities.js';
import { type Formatter, type LAZY_TYPES, type TreeDataOption } from './../interfaces/index.js';
import { parseFormatterWhenExist } from './formatterUtilities.js';

/** Formatter that must be use with a Tree Data column */
export const treeFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  const gridOptions = grid.getOptions();
  const treeDataOptions = (gridOptions.treeDataOptions ?? {}) as TreeDataOption;
  const indentMarginLeft = treeDataOptions.indentMarginLeft ?? 15;
  const { collapsedPropName, hasChildrenPropName, levelPropName, lazyLoadingPropName } = getTreeDataPropNames(treeDataOptions);

  // when a queryFieldNameGetterFn is defined, then get the value from that getter callback function
  let outputValue = getCellValueFromQueryFieldGetter(columnDef, dataContext, value);
  if (outputValue === null || outputValue === undefined || dataContext === undefined) {
    return '';
  }

  if (!dataContext.hasOwnProperty(levelPropName)) {
    throw new Error(
      '[Slickgrid-Universal] You must provide valid "treeDataOptions" in your Grid Options, however it seems that we could not find any tree level info on the current item datacontext row.'
    );
  }

  const lazyLoading = dataContext[lazyLoadingPropName] as LAZY_TYPES;
  const treeLevel = dataContext[levelPropName] ?? 0;
  const slickTreeLevelClass = `slick-tree-level-${treeLevel}`;

  let toggleClass = '';
  if (dataContext[hasChildrenPropName]) {
    toggleClass = lazyLoading && lazyLoading !== 'done' ? lazyLoading : dataContext[collapsedPropName] ? 'collapsed' : 'expanded';
  }

  const indentSpacerElm = createDomElement('span', { style: { display: 'inline-block', width: `${indentMarginLeft * treeLevel}px` } });
  const spanToggleClass = `slick-tree-toggle ${toggleClass}`.trim();
  const spanIconElm = createDomElement('div', { className: spanToggleClass, ariaExpanded: String(toggleClass === 'expanded') });

  const containerElm = createDocumentFragmentOrElement(gridOptions);
  containerElm.appendChild(indentSpacerElm);
  containerElm.appendChild(spanIconElm);
  if (lazyLoading === 'load-fail') {
    containerElm.appendChild(createDomElement('span', { className: 'slick-tree-load-fail' }));
  }

  if (treeDataOptions.titleFormatter) {
    outputValue = parseFormatterWhenExist(treeDataOptions.titleFormatter, row, cell, columnDef, dataContext, grid);
  }
  const treeTitleElm = createDomElement('span', { className: 'slick-tree-title' });
  if (gridOptions.treeDataOptions?.toggleOnNodeTitle) {
    treeTitleElm.classList.add('pointer');
  }
  applyHtmlToElement(treeTitleElm, outputValue, gridOptions);
  treeTitleElm.setAttribute('level', treeLevel);
  containerElm.appendChild(treeTitleElm);

  return { addClasses: slickTreeLevelClass, html: containerElm };
};
