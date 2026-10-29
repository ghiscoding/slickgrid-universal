import { addWhiteSpaces, createDomElement, stripTags } from '@slickgrid-universal/utils';
import type { SlickGrid } from '../core/slickGrid.js';
import { applyHtmlToElement } from '../core/utils.js';
import { createDocumentFragmentOrElement, getCellValueFromQueryFieldGetter, getTreeDataPropNames } from '../services/utilities.js';
import type { Column, Formatter, LAZY_TYPES, TreeDataOption } from './../interfaces/index.js';
import { parseFormatterWhenExist } from './formatterUtilities.js';

/** Formatter that must be use with a Tree Data column */
export const treeFormatter: Formatter = (...args) => formatTree(...args);

/** Formatter that must be use with a Tree Data column when exporting (plain text output) */
export const treeExportFormatter: Formatter = (...args) => formatTree(...args, true);

function formatTree(row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid: SlickGrid, isExport?: boolean) {
  const gridOptions = grid.getOptions();
  const treeDataOptions = (gridOptions.treeDataOptions || {}) as TreeDataOption;
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
  if (treeDataOptions.titleFormatter) {
    outputValue = parseFormatterWhenExist(treeDataOptions.titleFormatter, row, cell, columnDef, dataContext, grid);
  }

  const treeLevel: number = dataContext[levelPropName] ?? 0;
  const hasChildren = dataContext[hasChildrenPropName];
  const isCollapsed = dataContext[collapsedPropName];

  if (isExport) {
    const leadChar = treeDataOptions.exportIndentationLeadingChar ?? '.';
    const toggleSymbol = hasChildren
      ? isCollapsed
        ? (gridOptions.excelExportOptions?.groupCollapsedSymbol ?? '⮞')
        : (gridOptions.excelExportOptions?.groupExpandedSymbol ?? '⮟')
      : '';
    // leaf items (except at root level) are indented one more level to cover the width of the parent's toggle symbol
    const indentSpacer = addWhiteSpaces(
      (treeDataOptions.exportIndentMarginLeft ?? 5) * (!hasChildren && treeLevel ? treeLevel + 1 : treeLevel)
    );
    const leadingChar = treeLevel
      ? leadChar
      : toggleSymbol
        ? ''
        : leadChar + addWhiteSpaces(treeDataOptions.exportIndentationLeadingSpaceCount ?? 3);
    return stripTags(`${leadingChar}${indentSpacer}${toggleSymbol} ${outputValue}`);
  }

  const lazyLoading = dataContext[lazyLoadingPropName] as LAZY_TYPES;
  let toggleClass = '';
  if (hasChildren) {
    toggleClass = lazyLoading && lazyLoading !== 'done' ? lazyLoading : isCollapsed ? 'collapsed' : 'expanded';
  }

  const containerElm = createDocumentFragmentOrElement(gridOptions);
  containerElm.appendChild(
    createDomElement('span', { style: { display: 'inline-block', width: `${(treeDataOptions.indentMarginLeft ?? 15) * treeLevel}px` } })
  );
  containerElm.appendChild(
    createDomElement('div', { className: `slick-tree-toggle ${toggleClass}`.trim(), ariaExpanded: String(toggleClass === 'expanded') })
  );
  if (lazyLoading === 'load-fail') {
    containerElm.appendChild(createDomElement('span', { className: 'slick-tree-load-fail' }));
  }

  const treeTitleElm = createDomElement('span', { className: 'slick-tree-title' });
  if (treeDataOptions.toggleOnNodeTitle) {
    treeTitleElm.classList.add('pointer');
  }
  applyHtmlToElement(treeTitleElm, outputValue, gridOptions);
  treeTitleElm.setAttribute('level', String(treeLevel));
  containerElm.appendChild(treeTitleElm);

  return { addClasses: `slick-tree-level-${treeLevel}`, html: containerElm };
}
