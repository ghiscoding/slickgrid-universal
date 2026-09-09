import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  Editors,
  Filters,
  formatNumber,
  Formatters,
  type AureliaGridInstance,
  type Column,
  type ColumnEditorDualInput,
  type GridOption,
  type SlickGrid,
} from 'aurelia-slickgrid';
import { showToast } from './utilities.js';
import './example20.scss';

export class Example20 {
  aureliaGrid!: AureliaGridInstance;
  gridObj!: SlickGrid;
  columns: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  pinnedColumnCount = 2;
  pinnedRightColumnCount = 1;
  pinnedRowCount = 3;
  hideSubTitle = false;
  isPinnedBottom = false;
  isSelectAllShownAsColumnTitle = false;
  checkboxSelectorInstance: any;
  constructor() {
    this.defineGrid();
  }
  attached() {
    this.dataset = Array.from({ length: 500 }, (_v, i) => ({
      id: i,
      title: `Task ${i}`,
      duration: `${Math.round(Math.random() * 100)}`,
      percentComplete: Math.round(Math.random() * 100),
      start: new Date(2009, 0, 1),
      finish: new Date(2009, 4, 5),
      completed: i % 5 === 0,
      cost: i % 33 === 0 ? null : Math.random() * 10000,
      cityOfOrigin: i % 2 ? 'Vancouver, BC, Canada' : 'Boston, MA, United States',
    }));
  }
  aureliaGridReady(g: AureliaGridInstance) {
    this.aureliaGrid = g;
    this.gridObj = g.slickGrid;
  }
  defineGrid() {
    const dual = {
      leftInput: { field: 'cost', type: 'float', decimal: 2, minValue: 0, maxValue: 50000 },
      rightInput: { field: 'duration', type: 'float', minValue: 0, maxValue: 100 },
    } as ColumnEditorDualInput;
    this.columns = [
      { id: 'title', name: 'Title', field: 'title', width: 120, minWidth: 100, sortable: true, filterable: true },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        width: 140,
        minWidth: 130,
        type: 'number',
        sortable: true,
        filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        editor: { model: Editors.singleSelect, collection: Array.from({ length: 101 }, (_v, i) => ({ value: i, label: i })) },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        type: 'dateIso',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        type: 'dateIso',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'completed',
        name: 'Completed',
        field: 'completed',
        sortable: true,
        filterable: true,
        formatter: Formatters.checkmarkMaterial,
        editor: { model: Editors.checkbox },
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
        },
      },
      {
        id: 'cost',
        name: 'Cost | Duration',
        field: 'cost',
        formatter: this.costDurationFormatter.bind(this),
        sortable: true,
        filter: { model: Filters.compoundSlider },
        editor: { model: Editors.dualInput, params: dual },
      },
      { id: 'cityOfOrigin', name: 'City of Origin', field: 'cityOfOrigin', minWidth: 100, sortable: true, filterable: true },
      {
        id: 'action',
        name: 'Action',
        field: 'action',
        width: 100,
        maxWidth: 100,
        excludeFromExport: true,
        formatter: () => '<div class="cell-menu-dropdown">Action<i class="mdi mdi-chevron-down"></i></div>',
        cellMenu: {
          commandTitle: 'Commands',
          commandItems: [
            { command: 'command1', title: 'Command 1' },
            { command: 'command2', title: 'Command 2', itemUsabilityOverride: (args: any) => !args.dataContext.completed },
            { command: 'delete-row', title: 'Delete Row', itemVisibilityOverride: (args: any) => !args.dataContext.completed },
            { divider: true, command: '' },
            { command: 'help', title: 'Help' },
            { command: 'something', title: 'Disabled Command', disabled: true },
          ],
          optionTitle: 'Change Complete Flag',
          optionItems: [
            { option: true, title: 'True' },
            { option: false, title: 'False' },
          ],
        },
      },
    ];
    this.gridOptions = {
      autoResize: { container: '#demo-container', rightPadding: 10 },
      // Keep the left-pinned columns compact so two right-pinned columns fit
      // beside the framework demo's route sidebar.
      autoFitColumnsOnFirstLoad: false,
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      enableFiltering: true,
      enableExcelCopyBuffer: true,
      enableExcelExport: true,
      externalResources: [new ExcelExportService()],
      enableSelection: true,
      enableCheckboxSelector: true,
      selectionOptions: { selectActiveRow: false },
      checkboxSelector: {
        hideInColumnTitleRow: true,
        hideInFilterHeaderRow: false,
        name: 'Sel',
        onExtensionRegistered: (i: any) => (this.checkboxSelectorInstance = i),
      },
      pinning: { columns: { left: ['_checkbox_selector', 'title', 'percentComplete'], right: ['action'] }, rows: { top: [0, 1, 2] } },
      enableCellMenu: true,
      cellMenu: {
        onCommand: (_e: any, a: any) => this.executeCommand(a),
        onOptionSelected: (_e: any, a: any) => {
          if (a?.dataContext) {
            a.dataContext.completed = a.item.option;
            this.aureliaGrid?.gridService?.updateItem(a.dataContext);
          }
        },
      },
      enableContextMenu: true,
      contextMenu: this.getContextMenuOptions(),
      gridMenu: { hideClearPinningCommand: false },
      headerMenu: { hidePinColumnCommand: false, hidePinningColumnsCommand: false },
    };
  }
  getContextMenuOptions(): any {
    const p = [
      { option: 0, title: 'Not Started (0%)' },
      { option: 50, title: 'Half Completed (50%)' },
      { option: 100, title: 'Completed (100%)' },
    ];
    return {
      optionShownOverColumnIds: ['percentComplete'],
      hideCloseButton: true,
      dropSide: 'right',
      optionTitle: 'Change Percent Complete',
      optionItems: [...p, 'divider', { option: null, title: 'Sub-Options (demo)', subMenuTitle: 'Set Percent Complete', optionItems: p }],
      commandItems: [
        { command: '', divider: true, positionOrder: 98 },
        {
          command: 'export',
          title: 'Exports',
          positionOrder: 99,
          commandItems: [
            { command: 'exports-txt', title: 'Text (tab delimited)' },
            {
              command: 'sub-menu',
              title: 'Excel',
              subMenuTitle: 'available formats',
              commandItems: [
                { command: 'exports-csv', title: 'Excel (csv)' },
                { command: 'exports-xlsx', title: 'Excel (xlsx)' },
              ],
            },
          ],
        },
        {
          command: 'feedback',
          title: 'Feedback',
          positionOrder: 100,
          commandItems: [
            { command: 'request-update', title: 'Request update from supplier' },
            'divider',
            {
              command: 'sub-menu',
              title: 'Contact Us',
              subMenuTitle: 'contact us...',
              commandItems: [
                { command: 'contact-email', title: 'Email us' },
                { command: 'contact-chat', title: 'Chat with us' },
                { command: 'contact-meeting', title: 'Book an appointment' },
              ],
            },
          ],
        },
      ],
      onOptionSelected: (_e: any, a: any) => {
        if (a?.dataContext) {
          a.dataContext.percentComplete = a.item.option;
          this.gridObj?.updateRow(a.row || 0);
        }
      },
      onCommand: (_e: any, a: any) => this.executeCommand(a),
    };
  }
  executeCommand(a: any) {
    if (a.command === 'delete-row' && confirm(`Do you really want to delete row (${a.row + 1}) with "${a.dataContext.title}"?`)) {
      this.aureliaGrid?.gridService?.deleteItemById(a.dataContext.id);
    } else if (['command1', 'command2', 'help'].includes(a.command)) {
      alert(a.item.title);
    } else if (['exports-csv', 'exports-txt', 'exports-xlsx'].includes(a.command)) {
      alert(`Exporting as ${a.item.title}`);
    } else {
      alert(`Command: ${a.command}`);
    }
  }
  setPinnedColumns(left: number, right = this.pinnedRightColumnCount) {
    const n = Math.max(0, Number(right) || 0);
    this.gridObj?.setOptions({
      pinning: {
        columns: {
          left: left >= 0 ? ['_checkbox_selector', 'title', 'percentComplete'].slice(0, left + 1) : [],
          right: ['cityOfOrigin', 'action'].slice(Math.max(0, 2 - n)),
        },
      },
    });
    this.pinnedColumnCount = left;
    this.pinnedRightColumnCount = n;
  }
  changePinnedColumnCount() {
    this.setPinnedColumns(this.pinnedColumnCount);
  }
  changePinnedRowCount() {
    const rows = this.getPinnedRowIndexes();
    this.gridObj?.setOptions({ pinning: { rows: this.isPinnedBottom ? { top: [], bottom: rows } : { top: rows, bottom: [] } } });
  }

  private getPinnedRowIndexes() {
    const rowCount = Math.max(0, Number(this.pinnedRowCount) || 0);
    const dataLength = this.gridObj?.getDataLength?.() ?? this.dataset.length;
    const firstPinnedRow = this.isPinnedBottom ? Math.max(0, dataLength - rowCount) : 0;
    return Array.from({ length: rowCount }, (_v, index) => firstPinnedRow + index);
  }
  toggleRightPinning() {
    this.setPinnedColumns(this.pinnedColumnCount, this.pinnedRightColumnCount > 0 ? 0 : 1);
  }
  togglePinnedBottomRows() {
    this.isPinnedBottom = !this.isPinnedBottom;
    this.changePinnedRowCount();
  }
  toggleSelectAllRow() {
    this.isSelectAllShownAsColumnTitle = !this.isSelectAllShownAsColumnTitle;
    this.checkboxSelectorInstance?.setOptions({
      hideInColumnTitleRow: !this.isSelectAllShownAsColumnTitle,
      hideInFilterHeaderRow: this.isSelectAllShownAsColumnTitle,
    });
  }
  setLargePinnedColumns() {
    this.aureliaGrid?.gridStateService?.applyColumnLayout?.(
      [
        { columnId: '_checkbox_selector', cssClass: 'slick-cell-checkboxsel', headerCssClass: '', width: 40 },
        { columnId: 'title', cssClass: '', headerCssClass: '', width: 220 },
        { columnId: 'percentComplete', cssClass: '', headerCssClass: '', width: 280 },
        { columnId: 'start', cssClass: '', headerCssClass: '', width: 150 },
        { columnId: 'finish', cssClass: '', headerCssClass: '', width: 280 },
        { columnId: 'completed', cssClass: '', headerCssClass: '', width: 180 },
        { columnId: 'cost', cssClass: '', headerCssClass: '', width: 220 },
        { columnId: 'cityOfOrigin', cssClass: '', headerCssClass: '', width: 180 },
        { columnId: 'action', cssClass: '', headerCssClass: '', width: 110 },
      ],
      false,
      false
    );
    this.setPinnedColumns(2, this.pinnedRightColumnCount);
  }
  onCellValidationError(_e: Event, args: any) {
    showToast(args.validationResults.msg, 'danger');
  }
  costDurationFormatter(_r: number, _c: number, _v: any, _d: Column, x: any) {
    const cost = x.cost == null ? 'n/a' : formatNumber(x.cost, 0, 2, false, '$', '', '.', ',');
    const duration = x.duration != null && x.duration >= 0 ? `${x.duration} ${x.duration > 1 ? 'days' : 'day'}` : 'n/a';
    return `<b>${cost}</b> | ${duration}`;
  }
  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    document.querySelector('.subtitle')?.classList[this.hideSubTitle ? 'add' : 'remove']('hidden');
    this.aureliaGrid?.resizerService?.resizeGrid(0);
  }
}
