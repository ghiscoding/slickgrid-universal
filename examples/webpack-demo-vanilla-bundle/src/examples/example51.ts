import {
  Column,
  FormatterResultObject,
  GridOption,
  OnEventArgs,
  SortDirectionString
} from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import '../salesforce-styles.scss';
import './example51.scss';

const ID_PROPERTY_NAME = 'id';

const aceColumnFormatter = (row, cell, value, columnDef, dataContext) => {
  let output = '';
  const treeLevelPropName = 'indent';
  const treeLevel = dataContext[treeLevelPropName];
  const hasAceChecked = dataContext.Engineering_Status__c && dataContext.Engineering_Status__c === 'Processed';

  if (treeLevel === 0 && hasAceChecked) {
    output = `<i class="mdi mdi-check checkmark-icon green" style="color: #4DCAA9; font-size: 20px" aria-hidden="true"></i>`;
  }
  return output;
};

const editColumnFormatter = (row, cell, value, columnDef, dataContext) => {
  let output = '';
  const treeLevelPropName = 'indent';
  const treeLevel = dataContext[treeLevelPropName];

  if (treeLevel === 0) {
    switch (value) {
      case 'Profiled':
        output = `<i class="mdi mdi-pencil" style="cursor: pointer; font-size: 20px" aria-hidden="true"></i>`;
        break;
      case 'Selector':
        output = `<i class="mdi mdi-cogs" style="cursor: pointer; font-size: 20px" aria-hidden="true"></i>`;
        break;
      default:
        output = '';
        break;
    }
  }
  return output;
};

const fakeHyperlinkFormatter = (row, cell, value, columnDef, dataContext, grid) => {
  return value ? `<span class="fake-hyperlink">${value}</span>` : '';
};

const actionCellFormatter = (row, cell, value, columnDef, dataContext, grid) => {
  return value ? `<span class="fake-hyperlink">${value}</span>` : '';
};

const sortSequenceFormatter = (row, cell, value, columnDef, dataContext) => {
  const treeLevelPropName = 'indent';
  return dataContext[treeLevelPropName] === 0 ? value : '';
};

const translationTypeFormatter = (row, cell, value, columnDef, dataContext) => {
  let output = '';
  const treeLevelPropName = 'indent';
  const treeLevel = dataContext[treeLevelPropName];

  if (treeLevel === 0) {
    switch (value) {
      case 'Drawing':
        output = `<i class="mdi mdi-file-send-outline" style="font-size: 20px" aria-hidden="true"></i>`;
        break;
      default:
        output = '';
        break;
    }
  }
  return output;
};

export class Example51 {
  editQueue = [];
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  sgb: SlickVanillaGridBundle;
  durationOrderByCount = false;
  searchString = '';
  sortDirection: SortDirectionString = 'ASC';
  sortSequenceBeforeEdit: number;

  attached() {
    this.initializeGrid();
    this.dataset = [];
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid51`);

    gridContainerElm.addEventListener('onclick', this.handleOnClick.bind(this));
    gridContainerElm.addEventListener('oncellchange', this.handleOnCellChange.bind(this));
    gridContainerElm.addEventListener('onvalidationerror', this.handleValidationError.bind(this));
    gridContainerElm.addEventListener('onbeforeeditcell', this.verifyCellIsEditableBeforeEditing.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions, []);
    try {
      this.sgb.dataset = require('c://TEMP/quote2.json'); // work data only
    } catch (e) { }
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'sortSequence', name: 'Sort Seq', field: 'sortSequence', minWidth: 60, maxWidth: 60,
        formatter: Slicker.Formatters.multiple, sortable: true,
        filterable: true, filter: { model: Slicker.Filters.compoundInputNumber }, type: Slicker.Enums.FieldType.number,
        // queryFieldNameGetterFn: (dataContext) => dataContext.Sort_Sequence_Number__c ? 'Sort_Sequence_Number__c' : 'Sort_Sequence_Number__c',
        params: {
          formatters: [sortSequenceFormatter, this.customEditableInputFormatter.bind(this)]
        },
        editor: {
          model: Slicker.Editors.float,
          required: true,
          alwaysSaveOnEnterKey: true,
        },
        onCellChange: (e, args) => {
          if (args && args.columnDef && args.dataContext) {
            const columnDef = args.columnDef;
            const item = args.dataContext;
            const grid = args.grid;
            const dataView = grid && grid.getData();
            const items = dataView.getItems();
            const treeLevelPropName = 'indent';
            const targetedSortSequenceNumber = item.sortSequence;
            const targetRowItem = items.find((searchItem) => searchItem[treeLevelPropName] === item[treeLevelPropName] && searchItem.sortSequence === targetedSortSequenceNumber && searchItem.id !== item.id);
            if (targetRowItem) {
              targetRowItem['sortSequence'] = this.sortSequenceBeforeEdit;
              dataView.updateItem(targetRowItem['id'], targetRowItem);
              grid.invalidate();
              this.sgb.sortService.updateSorting([{ columnId: 'sortSequence', direction: 'ASC' }]);
            }
          }
        }
      },
      { id: 'Translation_Underway__c', name: 'ACE', field: 'Translation_Underway__c', minWidth: 50, maxWidth: 50, formatter: aceColumnFormatter, filterable: true },
      { id: 'Line_Type__c', name: 'Edit', field: 'Line_Type__c', minWidth: 50, maxWidth: 50, formatter: editColumnFormatter, filterable: true },
      { id: 'Translation_Request_Type__c', name: 'Drawings', field: 'Translation_Request_Type__c', minWidth: 55, maxWidth: 55, formatter: translationTypeFormatter, filterable: true },
      {
        id: 'Quantity__c', name: 'Qty', field: 'Quantity__c', minWidth: 50, maxWidth: 50, filterable: true,
        editor: { model: Slicker.Editors.integer, }, formatter: this.customEditableInputFormatter.bind(this)
      },
      { id: 'Line_Item_Number__c', name: 'Item Num.', field: 'Line_Item_Number__c', minWidth: 80, maxWidth: 80, formatter: fakeHyperlinkFormatter, filterable: true },
      {
        id: 'product', name: 'Product', field: 'product', cssClass: 'cell-title', sortable: true, minWidth: 250, width: 300,
        filterable: true, formatter: Slicker.Formatters.tree,
      },
      { id: 'ERF_Product_Description__c', name: 'Description', field: 'ERF_Product_Description__c', minWidth: 150, filterable: true },
      {
        id: 'Designation__c', name: 'Designation', field: 'Designation__c', minWidth: 150, filterable: true,
        editor: { model: Slicker.Editors.longText, }, formatter: this.customEditableInputFormatter.bind(this),
      },
      { id: 'Price_Determined_Category_Number__c', name: 'PD Cat', field: 'Price_Determined_Category_Number__c', minWidth: 150, sortable: true, filterable: true, valueCouldBeUndefined: true, },
      { id: 'Line_Code__c', name: 'Line Code', field: 'Line_Code__c', minWidth: 150, filterable: true },
      { id: 'Price_Determination__c', name: 'Price Status', field: 'Price_Determination__c', minWidth: 150, filterable: true },
      { id: 'Unit_List_Price__c', name: 'Unit List Price', field: 'Unit_List_Price__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.dollar, },
      { id: 'Extended_list_Price__c', name: 'Ext. List Price', field: 'Extended_list_Price__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.dollar, },
      { id: 'Purchaser_Profile_Multiplier__c', name: 'Book Mult.', field: 'Purchaser_Profile_Multiplier__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.decimal, params: { minDecimal: 4, maxDecimal: 4, } },
      { id: 'Normal_Net_Extended_Price_Formula__c', name: 'Ext. Book Price', field: 'Normal_Net_Extended_Price_Formula__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.dollar, },
      { id: 'Recommended_Fix__c', name: 'System Fix', field: 'Recommended_Fix__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.checkmarkMaterial, },
      { id: 'Authorized_Selling_Net_Multiplier__c', name: 'Auth Sell Net Mult', field: 'Authorized_Selling_Net_Multiplier__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.decimal, params: { minDecimal: 4, maxDecimal: 4, } },
      { id: 'Auth_Sell_Ext_Price__c', name: 'Auth Ext Sell Price', field: 'Auth_Sell_Ext_Price__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.dollar, },
      {
        id: 'Auth_Sell_Ext_Price__c22', name: 'Auth Ext Sell Price | Multiplier', field: 'Auth_Sell_Ext_Price__c', minWidth: 150, filterable: true,
        editor: {
          model: Slicker.Editors.float,
          params: { decimalPlaces: 2 },
          required: true,
          alwaysSaveOnEnterKey: true,
        },
        formatter: this.authSellFormatter.bind(this)
      },
      { id: 'Requested_Sell_Net_Multiplier__c', name: 'Req Sell Net Mult.', field: 'Requested_Sell_Net_Multiplier__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.decimal, params: { minDecimal: 4, maxDecimal: 4, } },
      { id: 'Requested_Unit_Sell_Net_Price__c', name: 'Req Unit Sell Net Price', field: 'Requested_Unit_Sell_Net_Price__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.dollar, },
      { id: 'Requested_Extended_Selling_Net_price__c', name: 'Req Extended Price', field: 'Requested_Extended_Selling_Net_price__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.dollar, },
      { id: 'Requested_Fix_Price_Indicator__c', name: 'Req Fix', field: 'Requested_Fix_Price_Indicator__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.checkmarkMaterial, },
      { id: 'FOB_Amount__c', name: 'Fix Req Price', field: 'FOB_Amount__c', minWidth: 150, filterable: true, formatter: Slicker.Formatters.dollar, },
      { id: 'Lead_Time__c', name: 'Lead Time', field: 'Lead_Time__c', minWidth: 150, filterable: true },
      { id: 'Shipping_location__c', name: 'Shipping Location', field: 'Shipping_location__c', minWidth: 150, filterable: true },
      { id: 'ERF_Error_Message__c', name: 'Error Msg', field: 'ERF_Error_Message__c', minWidth: 150, filterable: true },
    ];

    this.gridOptions = {
      // useSalesforceDefaultGridOptions: true,
      datasetIdPropertyName: 'id',
      autoEdit: true, // true single click (false for double-click)
      autoCommitEdit: true,
      editable: true,
      autoResize: {
        container: '.grid-container',
        rightPadding: 70,
        bottomPadding: 125,
        minHeight: 200,
        minWidth: 300,
      },
      enableFiltering: true,
      gridMenu: {
        hideToggleFilterCommand: true
      },
      enableRowSelection: true,
      enableTreeData: true,
      // treeDataOptions: {
      //     columnId: 'Product',
      //     parentPropName: 'ACEWeb_Selector__c',
      //     childrenPropName: 'Quote_Line_Items__r',
      //     initialSort: {
      //         columnId: 'Sort_Sequence_Number__c',
      //         direction: 'ASC'
      //     }
      // },
      treeDataOptions: {
        columnId: 'product',
        levelPropName: 'indent',
        parentPropName: 'parentId',
        initialSort: {
          columnId: 'sortSequence',
          direction: 'ASC'
        }
      },
      multiColumnSort: false,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
      dataView: {
        syncGridSelection: true, // enable this flag so that the row selection follows the row even if we move it to another position
      },
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false, // hide the "Select All" from title bar
        columnIndexPosition: 2,
        selectableOverride: (row, dataContext) => dataContext.indent === 0
      },
      enableRowMoveManager: true,
      rowMoveManager: {
        // when using Row Move + Row Selection, you want to enable the following 2 flags so it doesn't cancel row selection
        singleRowMove: true,
        disableRowSelection: true,
        cancelEditOnDrag: true,
        usabilityOverride: (row, dataContext, grid) => {
          // move icon should only be usable & displayed on root level OR when item has children
          const dataView = grid && grid.getData();
          const identifierPropName = dataView.getIdPropertyName() || 'id';
          const treeLevelPropName = 'indent';
          const idx = dataView.getIdxById(dataContext[identifierPropName]);
          const nextItemRow = dataView.getItemByIdx(idx + 1);
          if ((dataContext && dataContext[treeLevelPropName] === 0) || (nextItemRow && nextItemRow[treeLevelPropName] > dataContext[treeLevelPropName])) {
            return true;
          }
          return false;
        },
        onBeforeMoveRows: (e, args) => this.onBeforeMoveRow(e, args),
        onMoveRows: (e, args) => this.onMoveRows(e, args),
      },
      headerRowHeight: 45,
      rowHeight: 45,
      // eventNamingStyle: 'lowerCaseWithoutOnPrefix',
      editCommandHandler: (item, column, editCommand) => {
        this.editQueue.push({ item, column, command: editCommand });
        editCommand.execute();
      },
    };
  }

  canRowBeMoved(row, dataContext, grid) {
    // move icon should only be usable & displayed on root level OR when item has children
    const dataView = grid && grid.getData();
    const identifierPropName = dataView.getIdPropertyName() || 'id';
    const treeLevelPropName = '__treeLevel';
    const idx = dataView.getIdxById(dataContext[identifierPropName]);
    const nextItemRow = dataView.getItemByIdx(idx + 1);
    if (dataContext[treeLevelPropName] === 0 || nextItemRow && nextItemRow[treeLevelPropName] > dataContext[treeLevelPropName]) {
      return true;
    }
    return false;
  }

  dispose() {
    this.sgb?.dispose();
  }

  searchItem(event: KeyboardEvent) {
    this.searchString = (event.target as HTMLInputElement).value;
    this.sgb?.dataView.refresh();
  }

  authSellFormatter(row, cell, value, columnDef, dataContext) {
    // Auth_Sell_Ext_Price__c, Requested_Sell_Net_Multiplier__c
    let authSellPrice = '';
    if (dataContext.Auth_Sell_Ext_Price__c !== undefined) {
      authSellPrice = Slicker.Utilities.formatNumber(dataContext.Auth_Sell_Ext_Price__c, 0, 2, false, '$', '', '.', ',');
    }
    let authSellMulti = '';
    if (dataContext.Authorized_Selling_Net_Multiplier__c !== undefined) {
      authSellMulti = Slicker.Utilities.formatNumber(dataContext.Authorized_Selling_Net_Multiplier__c, 4, 4, false, '', '', '.', ',');
    }
    return `${authSellPrice} | <b>${authSellMulti}</b>`;
  }

  aceColumnFormatter(row, cell, value, columnDef, dataContext) {
    let output = '';
    const treeLevelPropName = columnDef.treeData?.levelPropName || '__treeLevel';
    const treeLevel = dataContext[treeLevelPropName];
    const hasAceChecked = dataContext.Engineering_Status__c && dataContext.Engineering_Status__c === 'Processed';

    if (treeLevel === 0 && hasAceChecked) {
      output = `<i class="mdi mdi-check checkmark-icon green" style="color: #4DCAA9; font-size: 20px" aria-hidden="true"></i>`;
    }
    return output;
  }

  editColumnFormatter(row, cell, value, columnDef, dataContext) {
    let output = '';
    const treeLevelPropName = columnDef.treeData?.levelPropName || '__treeLevel';
    const __treeLevel = dataContext[treeLevelPropName];

    if (__treeLevel === 0) {
      switch (value) {
        case 'Profiled':
          output = `<i class="mdi mdi-pencil" style="cursor: pointer; font-size: 20px" aria-hidden="true"></i>`;
          break;
        case 'Selector':
          output = `<i class="mdi mdi-cogs" style="cursor: pointer; font-size: 20px" aria-hidden="true"></i>`;
          break;
        default:
          output = '';
          break;
      }
    }
    return output;
  }

  fakeHyperlinkFormatter(row: number, cell: number, value: any) {
    return value ? `<span class="fake-hyperlink">${value}</span>` : '';
  }

  // This Formatter is used in combo with the "usabilityOverride" defined in the RowMoveManager creation
  moveIconFormatter(row, cell, value, columnDef, dataContext) {
    const treeLevelPropName = columnDef.treeData?.levelPropName || '__treeLevel';
    if (dataContext[treeLevelPropName] === 0) {
      return { addClasses: 'cell-reorder', text: '' } as FormatterResultObject;
    }
    return '';
  }

  sortSequenceFormatter(row, cell, value, columnDef, dataContext) {
    const treeLevelPropName = columnDef.treeData?.levelPropName || '__treeLevel';
    return dataContext[treeLevelPropName] === 0 ? value : '';
  }

  translationTypeFormatter(row, cell, value, columnDef, dataContext) {
    let output = '';
    const treeLevelPropName = columnDef.treeData?.levelPropName || '__treeLevel';

    if (treeLevelPropName === 0) {
      switch (value) {
        case 'Drawing':
          output = `<i class="mdi mdi-file-send-outline" style="font-size: 20px" aria-hidden="true"></i>`;
          break;
        default:
          output = '';
          break;
      }
    }
    return output;
  }

  customEditableInputFormatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
    const isEditableLine = this.isItemEditable(dataContext, columnDef);
    value = (value === null || value === undefined) ? '' : value;

    return isEditableLine ? { text: value, addClasses: 'editable-field', toolTip: 'Click to Edit' } : value;
  }

  onCellChange(args: OnEventArgs) {
    if (args && args.columnDef && args.dataContext) {
      const field = args.columnDef.field;
      const item = args.dataContext;
      const lastEdit = this.editQueue.pop();
      const oldValue = lastEdit && lastEdit.prevSerializedValue;
      const newValue = item[field];
      const alwaysSaveOnEnterKey = args.columnDef.internalColumnEditor && args.columnDef.internalColumnEditor.alwaysSaveOnEnterKey || false;

      if (alwaysSaveOnEnterKey || oldValue !== newValue) {
        this.updateLineItem(item, { fieldName: field, fieldValue: item[field] });
      }
    }
  }

  updateLineItem(item: any, fieldUpdate: { fieldName: string; fieldValue: string; id?: string; }) {
    console.log('item update:', item, fieldUpdate);
  }

  onBeforeMoveRow(e, data) {
    for (let i = 0; i < data.rows.length; i++) {
      // no point in moving before or after itself
      if (data.rows[i] === data.insertBefore || data.rows[i] === data.insertBefore - 1) {
        e.stopPropagation();
        return false;
      }
    }
    return true;
  }

  onMoveRows(e, args) {
    const extractedRows = [];
    const grid = args && args.grid;
    const rows = args && args.rows || [];
    const dataView = grid.getData();
    const items = dataView.getItems();

    if (grid && Array.isArray(rows) && rows.length > 0) {
      const insertBefore = args.insertBefore;
      const left = items.slice(0, insertBefore);
      const right = items.slice(insertBefore, items.length);

      // find the clicked row and the drop target row
      // then switch their Sort Sequence
      const targetIndex = ((args.insertBefore - 1) >= 0) ? (args.insertBefore - 1) : 0;
      const clickedRowItem = grid.getDataItem(rows[0]);
      const targetRowItem = grid.getDataItem(targetIndex);

      // interchange sort sequence property of the clicked row to the target row
      this.flipItemsSortSequences(clickedRowItem, targetRowItem);

      rows.sort((a, b) => a - b); // sort the rows

      for (let i = 0; i < rows.length; i++) {
        extractedRows.push(items[rows[i]]);
      }

      rows.reverse();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row < insertBefore) {
          left.splice(row, 1);
        } else {
          right.splice(row - insertBefore, 1);
        }
      }
      const updatedDataset = left.concat(extractedRows.concat(right));
      this.sgb.dataset = updatedDataset;
      this.sgb.sortService.updateSorting([{ columnId: 'Sort_Sequence_Number__c', direction: 'ASC' }]);
    }
  }

  /**
   * find the clicked row and the drop target row
   * then switch their Sort Sequence
   */
  flipItemsSortSequences(clickedRowItem, targetRowItem) {
    if (clickedRowItem && targetRowItem) {
      const clickedItemSeqNumber = clickedRowItem['Sort_Sequence_Number__c'];
      const targetItemSeqNumber = targetRowItem['Sort_Sequence_Number__c'];
      clickedRowItem['Sort_Sequence_Number__c'] = targetItemSeqNumber;
      targetRowItem['Sort_Sequence_Number__c'] = clickedItemSeqNumber;
    } else {
      throw new Error('[Slickgrid-Universal] could not find clicked row item');
    }
  }

  collapseAll() {
    this.sgb?.treeDataService.toggleTreeDataCollapse(true);
  }

  expandAll() {
    this.sgb?.treeDataService.toggleTreeDataCollapse(false);
  }

  handleOnClick(event: CustomEvent) {
    console.log('handle on cell click');
    const eventDetail = event && event.detail;
    const args = event && event.detail && event.detail.args;
    if (eventDetail && args) {
      const grid = args.grid;
      const columnDef = grid && grid.getColumns()[args.cell];
      const field = columnDef && columnDef.field || '';
      const cell = this.sgb?.slickGrid.getCellFromEvent(eventDetail.eventData);
      const currentRow = cell && cell.row;
      const dataContext = this.sgb?.slickGrid.getDataItem(currentRow);
      const treeLevelPropName = 'indent';

      switch (field) {
        case 'Line_Type__c':
          if (dataContext[treeLevelPropName] === 0) {
            if (dataContext['Line_Type__c'] === 'Profiled') {
              alert('call update line modal window');
            } else if (dataContext['Line_Type__c'] === 'Selector') {
              alert('selector');
            }
          }
          break;
        case 'Translation_Request_Type__c':
          console.log('translation');
          break;
      }
    }
  }

  handleOnCellChange(event) {
    const item = event.detail && event.detail.args && event.detail.args.item || {};
    // console.log(item)
  }

  handleValidationError(event) {
    console.log('handleValidationError', event.detail);
    const args = event.detail && event.detail.args;
    if (args.validationResults) {
      alert(args.validationResults.msg);
    }
  }

  logExpandedStructure() {
    console.log('exploded array', this.sgb?.treeDataService.datasetHierarchical /* , JSON.stringify(explodedArray, null, 2) */);
  }

  logFlatStructure() {
    console.log('flat array', this.sgb?.treeDataService.dataset /* , JSON.stringify(outputFlatArray, null, 2) */);
  }

  isItemEditable(dataContext: any, columnDef: Column): boolean {
    const treeLevelPropName = '__treeLevel';
    if (!dataContext || dataContext[treeLevelPropName] > 0) {
      return false;
    }
    let isEditable = false;
    switch (columnDef.id) {
      case 'Sort_Sequence_Number__c':
        isEditable = true;
        break;
      case 'Quantity__c':
        isEditable = dataContext['Line_Type__c'] === 'Profiled' ? true : false;
        break;
      case 'Designation__c':
        isEditable = true;
        break;
      case 'Auth_Sell_Ext_Price__c22':
        isEditable = true;
        break;
    }
    return isEditable;
  }

  verifyCellIsEditableBeforeEditing(event) {
    const eventData = event?.detail?.eventData;
    const args = event?.detail?.args;

    if (args && args.column && args.item) {
      this.sortSequenceBeforeEdit = args?.item?.Sort_Sequence_Number__c || -1;
      if (!this.isItemEditable(args.item, args.column)) {
        event.preventDefault();
        eventData.stopImmediatePropagation();
        return false;
      }
    }
  }
}
