/* oxlint-disable @typescript-eslint/no-this-alias */
import { createDomElement, titleCase } from '@slickgrid-universal/utils';
import type { SlickGrid } from '../core/slickGrid.js';
import { applyHtmlToElement } from '../core/utils.js';
import type { ColumnPickerOption, DOMEvent, GridMenuOption } from '../interfaces/index.js';
import { SlickColumnPicker } from './slickColumnPicker.js';
import { SlickGridMenu } from './slickGridMenu.js';

const PICKER_CHECK_ICON = 'mdi-icon-picker-check';
const PICKER_UNCHECK_ICON = 'mdi-icon-picker-uncheck';

/** Create a Close button element and add it to the Menu element */
export function addCloseButtomElement(this: SlickColumnPicker | SlickGridMenu, menuElm: HTMLDivElement): void {
  const context: any = this;
  const closePickerButtonElm = createDomElement('button', {
    type: 'button',
    className: 'close',
    ariaLabel: 'Close',
    textContent: '×',
    dataset: { dismiss: context instanceof SlickColumnPicker ? 'slick-column-picker' : 'slick-grid-menu' },
  });
  menuElm.appendChild(closePickerButtonElm);
}

/** When "columnTitle" option is provided, let's create a div element to show "Columns" list title */
export function addColumnTitleElementWhenDefined(this: SlickColumnPicker | SlickGridMenu, menuElm: HTMLDivElement): void {
  const context: any = this;
  if (context.addonOptions?.columnTitle) {
    context._columnTitleElm = createDomElement(
      'div',
      { className: 'slick-menu-title', textContent: context.addonOptions?.columnTitle ?? context._defaults.columnTitle },
      menuElm
    );
  }
}

/**
 * When clicking an input checkboxes from the column picker list to show/hide a column (or from the picker extra commands like forcefit columns)
 * @param event - input checkbox event
 * @returns
 */
export function handleColumnPickerItemClick(this: SlickColumnPicker | SlickGridMenu, event: DOMEvent<HTMLInputElement>): void {
  const context: any = this;
  const controlType = context instanceof SlickColumnPicker ? 'columnPicker' : 'gridMenu';
  const iconContainerElm = event.target?.closest('.icon-checkbox-container') as HTMLDivElement;
  const iconElm = iconContainerElm?.querySelector<HTMLDivElement>('.mdi');
  const isChecked = !!event.target.checked;
  event.target.ariaChecked = String(isChecked);
  togglePickerCheckbox(iconElm, isChecked);
  const grid = context.grid as SlickGrid;

  if (event.target.dataset.option === 'autoresize') {
    // when calling setOptions, it will resize with ALL Columns (even the hidden ones)
    // we can avoid this problem by keeping a reference to the visibleColumns before setOptions and then setColumns after
    grid.setOptions({ forceFitColumns: isChecked });
    grid.updateColumns();
    return;
  }

  if (event.target.dataset.option === 'syncresize') {
    grid.setOptions({ syncColumnCellResize: isChecked });
    return;
  }

  if (event.target.type === 'checkbox') {
    context._areVisibleColumnDifferent = true;
    const columnId = event.target.dataset.columnid || '';

    // validate that the checkbox changes is allowed before going any further
    const isFrozenAllowed = grid.validateColumnFreeze(columnId, true);
    let visibleColumns = context.getVisibleColumns();

    if (!isFrozenAllowed || (visibleColumns.length - 1 < 1 && !isChecked)) {
      event.target.checked = true;
      togglePickerCheckbox(iconElm, true);
      return;
    }

    grid.updateColumnById(columnId, { hidden: !isChecked });
    if (!isChecked && context.gridOptions.enableCellRowSpan) {
      grid.remapAllColumnsRowSpan(); // remap row spans when column gets hidden and cell rowspan is enabled
    }
    grid.updateColumns();
    visibleColumns = context.getVisibleColumns();

    // keep reference to the updated visible columns list
    // prettier-ignore
    if (!context.sharedService.visibleColumns || (Array.isArray(visibleColumns) && visibleColumns.length !== context.sharedService.visibleColumns.length)) {
      context.sharedService.visibleColumns = visibleColumns;
    }

    // when using row selection, SlickGrid will only apply the "selected" CSS class on the visible columns only
    // and if the row selection was done prior to the column being shown then that column that was previously hidden (at the time of the row selection)
    // will not have the "selected" CSS class because it wasn't visible at the time.
    // To bypass this problem we can simply recall the row selection with the same selection and that will trigger a re-apply of the CSS class
    // on all columns including the column we just made visible
    if ((context.gridOptions.enableRowSelection || context.gridOptions.enableHybridSelection) && isChecked) {
      const rowSelection = grid.getSelectedRows();
      grid.setSelectedRows(rowSelection);
    }

    const callbackArgs = {
      columnId,
      showing: isChecked,
      allColumns: grid.getColumns(),
      visibleColumns,
      columns: visibleColumns,
      grid,
    };

    // execute user callback when defined
    context.pubSubService.publish(`on${titleCase(controlType)}ColumnsChanged`, callbackArgs);
    if (typeof context.addonOptions?.onColumnsChanged === 'function') {
      context.addonOptions.onColumnsChanged(event, callbackArgs);
    }
    context.onColumnsChanged.notify(callbackArgs, null, context);
  }
}

function togglePickerCheckbox(iconElm: HTMLDivElement | null, checked = false): void {
  if (iconElm) {
    iconElm.className = `mdi ${checked ? PICKER_CHECK_ICON : PICKER_UNCHECK_ICON}`;
  }
}

function generatePickerCheckbox(
  columnLiElm: HTMLLIElement,
  inputId: string,
  inputData: any,
  checked = false
): {
  inputElm: HTMLInputElement;
  labelElm: HTMLLabelElement;
  labelSpanElm: HTMLSpanElement;
} {
  const labelElm = createDomElement('label', { className: 'checkbox-picker-label', htmlFor: inputId });
  const divElm = createDomElement('div', { className: 'icon-checkbox-container' });
  const inputElm = createDomElement('input', { id: inputId, type: 'checkbox', dataset: inputData });
  const colInputDivElm = createDomElement('div', { className: `mdi ${checked ? PICKER_CHECK_ICON : PICKER_UNCHECK_ICON}` });
  const labelSpanElm = createDomElement('span', { className: 'checkbox-label' });
  divElm.appendChild(inputElm);
  divElm.appendChild(colInputDivElm);
  labelElm.appendChild(divElm);
  labelElm.appendChild(labelSpanElm);
  columnLiElm.appendChild(labelElm);

  if (checked) {
    inputElm.ariaChecked = 'true';
    inputElm.checked = true;
  }

  return { inputElm, labelElm, labelSpanElm };
}

export function populateColumnPicker(this: SlickColumnPicker | SlickGridMenu, addonOptions: ColumnPickerOption | GridMenuOption): void {
  const context: any = this;
  const isGridMenu = context instanceof SlickGridMenu;
  const menuPrefix = isGridMenu ? 'gridmenu-' : '';
  const grid = context.grid as SlickGrid;

  let sortedColumns = context.columns;
  if (typeof addonOptions?.columnSort === 'function') {
    // create a sorted copy of the columns array based on the "name" property
    sortedColumns = [...context.columns].sort(addonOptions.columnSort);
  }

  for (const column of sortedColumns) {
    const columnId = column.id;
    const columnLiElm = document.createElement('li');
    if ((column.excludeFromColumnPicker && !isGridMenu) || (column.excludeFromGridMenu && isGridMenu)) {
      columnLiElm.className = 'hidden';
    }

    const inputId = `${context._gridUid}-${menuPrefix}colpicker-${columnId}`;
    const isChecked = grid.getVisibleColumns().some((col) => col.id === columnId && !col.hidden);
    const { inputElm, labelElm, labelSpanElm } = generatePickerCheckbox(columnLiElm, inputId, { columnid: `${columnId}` }, isChecked);
    context._columnCheckboxes.push(inputElm);

    const headerColumnValueExtractorFn: Function =
      typeof addonOptions?.headerColumnValueExtractor === 'function'
        ? addonOptions.headerColumnValueExtractor
        : context._defaults.headerColumnValueExtractor;
    const columnLabel = headerColumnValueExtractorFn(column, context.gridOptions);

    applyHtmlToElement(labelSpanElm, columnLabel, this.gridOptions);
    columnLiElm.appendChild(labelElm);
    context._listElm.appendChild(columnLiElm);
  }

  if (!addonOptions.hideForceFitButton || !addonOptions.hideSyncResizeButton) {
    context._listElm.appendChild(document.createElement('hr'));
  }

  if (!addonOptions?.hideForceFitButton) {
    const fitLiElm = document.createElement('li');
    const inputId = `${context._gridUid}-${menuPrefix}colpicker-forcefit`;
    const { labelSpanElm } = generatePickerCheckbox(fitLiElm, inputId, { option: 'autoresize' }, context.gridOptions.forceFitColumns);
    labelSpanElm.textContent = addonOptions?.forceFitTitle ?? '';
    context._listElm.appendChild(fitLiElm);
  }

  if (!addonOptions?.hideSyncResizeButton) {
    const syncLiElm = document.createElement('li');
    const inputId = `${context._gridUid}-${menuPrefix}colpicker-syncresize`;
    const { labelSpanElm } = generatePickerCheckbox(syncLiElm, inputId, { option: 'syncresize' }, context.gridOptions.forceFitColumns);
    labelSpanElm.textContent = addonOptions?.syncResizeTitle ?? '';
    context._listElm.appendChild(syncLiElm);
  }
}

/**
 * Because columns can be reordered, we have to update the `columns` to reflect the new order, however we can't just take `grid.getColumns()`,
 * as it does not include columns currently hidden by the picker. We create a new `columns` structure by leaving currently-hidden
 * columns in their original ordinal position and interleaving the results of the current column sort.
 */
export function updateColumnPickerOrder(this: SlickColumnPicker | SlickGridMenu): void {
  const context: any = this;

  const current = context.grid.getColumns().slice(0);
  const ordered = new Array(context.columns.length);

  for (let i = 0, ln = ordered.length; i < ln; i++) {
    const columnIdx = context.grid.getColumnIndex(context.columns[i].id);
    if (columnIdx === undefined) {
      // if the column doesn't return a value from getColumnIndex, it is hidden. Leave it in this position.
      ordered[i] = context.columns[i];
    } else {
      // otherwise, grab the next visible column.
      ordered[i] = current.shift();
    }
  }

  // the new set of ordered columns becomes the new set of column picker columns
  context._columns = ordered;
}
