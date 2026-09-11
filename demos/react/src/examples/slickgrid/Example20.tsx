import { ExcelExportService } from '@slickgrid-universal/excel-export';
import React, { useEffect, useRef, useState } from 'react';
import {
  Editors,
  Filters,
  formatNumber,
  Formatters,
  SlickgridReact,
  type Column,
  type ColumnEditorDualInput,
  type GridOption,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import { showToast } from './utilities.js';

const Example20: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(getData());
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [pinnedColumnCount, setPinnedColumnCount] = useState(2);
  const [pinnedTopRowCount, setPinnedTopRowCount] = useState(3);
  const [pinnedBottomRowCount, setPinnedBottomRowCount] = useState(2);
  const [pinnedRightColumnCount, setPinnedRightColumnCount] = useState(1);
  const [hideSubTitle, setHideSubTitle] = useState(false);
  const [isSelectAllShownAsColumnTitle, setIsSelectAllShownAsColumnTitle] = useState(false);
  const checkboxSelectorRef = useRef<any>(null);
  const pinnedColumnCountRef = useRef(2);
  const pinnedRightColumnCountRef = useRef(1);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columns: Column[] = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        minWidth: 100,
        width: 120,
        filterable: true,
        sortable: true,
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        resizable: false,
        minWidth: 130,
        width: 140,
        type: 'number',
        filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        sortable: true,
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        type: 'dateIso',
        filterable: true,
        sortable: true,
        formatter: Formatters.dateIso,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        type: 'dateIso',
        filterable: true,
        sortable: true,
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
        formatter: costDurationFormatter,
        sortable: true,
        // filterable: true,
        filter: {
          model: Filters.compoundSlider,
        },
        editor: {
          model: Editors.dualInput,
          // the DualInputEditor is of Type ColumnEditorDualInput and MUST include (leftInput/rightInput) in its params object
          // in each of these 2 properties, you can pass any regular properties of a column editor
          // and they will be executed following the options defined in each
          params: {
            leftInput: {
              field: 'cost',
              type: 'float',
              decimal: 2,
              minValue: 0,
              maxValue: 50000,
              placeholder: '< 50K',
              errorMessage: 'Cost must be positive and below $50K.',
            },
            rightInput: {
              field: 'duration',
              type: 'float', // you could have 2 different input type as well
              minValue: 0,
              maxValue: 100,
              title: 'make sure Duration is withing its range of 0 to 100',
              errorMessage: 'Duration must be between 0 and 100.',

              // Validator Option #1
              // You could also optionally define a custom validator in 1 or both inputs
              /*
              validator: (value, args) => {
                let isValid = true;
                let errorMsg = '';
                if (value < 0 || value > 120) {
                  isValid = false;
                  errorMsg = 'Duration MUST be between 0 and 120.';
                }
                return { valid: isValid, msg: errorMsg };
              }
              */
            },
          } as ColumnEditorDualInput,

          // Validator Option #2 (shared Validator) - this is the last alternative, option #1 (independent Validators) is still the recommended way
          // You can also optionally use a common Validator (if you do then you cannot use the leftInput/rightInput validators at same time)
          // to compare both values at the same time.
          /*
          validator: (values, args) => {
            let isValid = true;
            let errorMsg = '';
            if (values.cost < 0 || values.cost > 50000) {
              isValid = false;
              errorMsg = 'Cost MUST be between 0 and 50k.';
            }
            if (values.duration < 0 || values.duration > 120) {
              isValid = false;
              errorMsg = 'Duration MUST be between 0 and 120.';
            }
            if (values.cost < values.duration) {
              isValid = false;
              errorMsg = 'Cost can never be lower than its Duration.';
            }
            return { valid: isValid, msg: errorMsg };
          }
          */
        },
      },
      {
        id: 'cityOfOrigin',
        name: 'City of Origin',
        field: 'cityOfOrigin',
        minWidth: 100,
        pinnable: false,
        filterable: true,
        sortable: true,
      },
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

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      // Keep the left-pinned columns compact so two right-pinned columns fit
      // beside the framework demo's route sidebar.
      autoFitColumnsOnFirstLoad: false,
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      enableExcelCopyBuffer: true,
      enableExcelExport: true,
      externalResources: [new ExcelExportService()],
      enableFiltering: true,
      enableSelection: true,
      enableCheckboxSelector: true,
      selectionOptions: { selectActiveRow: false },
      checkboxSelector: {
        hideInColumnTitleRow: !isSelectAllShownAsColumnTitle,
        hideInFilterHeaderRow: isSelectAllShownAsColumnTitle,
        name: 'Sel',
        onExtensionRegistered: (instance: any) => (checkboxSelectorRef.current = instance),
      },
      pinning: {
        columns: { left: ['_checkbox_selector', 'title', 'percentComplete'], right: ['action'] },
        rows: { top: [0, 1, 2], bottom: [498, 499] },
      },

      // show both single-column and bulk pinning commands in HeaderMenu & GridMenu; these are opt-in commands
      gridMenu: {
        hideClearPinningCommand: false,
        // Grid Menu visibility updates rebuild the column layout. Reassert the
        // demo's current ID-based pinning after that rebuild so React's right
        // pinning state cannot briefly fall back to the scrolling band.
        onColumnsChanged: () => reapplyPinnedColumns(),
      },
      headerMenu: { hidePinColumnCommand: false, hidePinningColumnsCommand: false },
      enableCellMenu: true,
      cellMenu: {
        onCommand: (_e: unknown, args: any) => executeCommand(args),
        onOptionSelected: (_e: unknown, args: any) => {
          if (args?.dataContext) {
            args.dataContext.completed = args.item.option;
            reactGridRef.current?.gridService?.updateItem(args.dataContext);
          }
        },
      },
      enableContextMenu: true,
      contextMenu: getContextMenuOptions(),
    };

    setColumns(columns);
    setGridOptions(gridOptions);
  }

  function getData() {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < 500; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        cost: i % 33 === 0 ? null : Math.random() * 10000,
        duration: i % 8 ? Math.round(Math.random() * 100) + '' : null,
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(2009, 0, 1),
        finish: new Date(2009, 4, 5),
        completed: i % 5 === 0,
        cityOfOrigin: i % 2 ? 'Vancouver, BC, Canada' : 'Boston, MA, United States',
      };
    }
    return mockDataset;
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
  function updatePinnedRowCount(value: number, side: 'top' | 'bottom') {
    const nextPinnedRowCount = Math.max(0, Number(value) || 0);
    const slickGrid = reactGridRef.current?.slickGrid;
    const dataLength = slickGrid?.getDataLength?.() ?? dataset.length;
    const topCount = side === 'top' ? nextPinnedRowCount : pinnedTopRowCount;
    const bottomCount = side === 'bottom' ? nextPinnedRowCount : pinnedBottomRowCount;
    const getRows = (count: number, isBottom = false) => {
      const firstPinnedRow = isBottom ? Math.max(0, dataLength - count) : 0;
      return Array.from({ length: count }, (_v, index) => firstPinnedRow + index);
    };
    slickGrid?.setOptions({
      pinning: { rows: { top: getRows(topCount), bottom: getRows(bottomCount, true) } },
    });

    if (side === 'top') {
      setPinnedTopRowCount(nextPinnedRowCount);
    } else {
      setPinnedBottomRowCount(nextPinnedRowCount);
    }
  }

  function getContextMenuOptions(): any {
    const percentItems = [
      { option: 0, title: 'Not Started (0%)' },
      { option: 50, title: 'Half Completed (50%)' },
      { option: 100, title: 'Completed (100%)' },
    ];
    return {
      optionShownOverColumnIds: ['percentComplete'],
      hideCloseButton: true,
      dropSide: 'right',
      optionTitle: 'Change Percent Complete',
      optionItems: [
        ...percentItems,
        'divider',
        { option: null, title: 'Sub-Options (demo)', subMenuTitle: 'Set Percent Complete', optionItems: percentItems },
      ],
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
      onOptionSelected: (_e: unknown, args: any) => {
        if (args?.dataContext) {
          args.dataContext.percentComplete = args.item.option;
          reactGridRef.current?.slickGrid?.updateRow(args.row || 0);
        }
      },
      onCommand: (_e: unknown, args: any) => executeCommand(args),
    };
  }

  function executeCommand(args: any) {
    if (args.command === 'delete-row') {
      if (confirm(`Do you really want to delete row (${args.row + 1}) with "${args.dataContext.title}"?`)) {
        reactGridRef.current?.gridService?.deleteItemById(args.dataContext.id);
      }
    } else if (['command1', 'command2', 'help'].includes(args.command)) {
      alert(args.item.title);
    } else if (['exports-csv', 'exports-txt', 'exports-xlsx'].includes(args.command)) {
      alert(`Exporting as ${args.item.title}`);
    } else {
      alert(`Command: ${args.command}`);
    }
  }

  function costDurationFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, dataContext: any) {
    const costText = isNullUndefinedOrEmpty(dataContext.cost) ? 'n/a' : formatNumber(dataContext.cost, 0, 2, false, '$', '', '.', ',');
    let durationText = 'n/a';
    if (!isNullUndefinedOrEmpty(dataContext.duration) && dataContext.duration >= 0) {
      durationText = `${dataContext.duration} ${dataContext.duration > 1 ? 'days' : 'day'}`;
    }
    return `<b>${costText}</b> | ${durationText}`;
  }

  function isNullUndefinedOrEmpty(data: any) {
    return data === '' || data === null || data === undefined;
  }

  function onCellValidationError(_e: Event, args: any) {
    showToast(args.validationResults.msg, 'danger');
  }

  function removePinnedColumns() {
    setPinnedColumns(-1, 0);
    setPinnedColumnCount(0);
  }

  function setPinnedColumns(left: number, right = pinnedRightColumnCount) {
    const nextRight = Math.max(0, Number(right) || 0);
    const rightIds = ['cityOfOrigin', 'action'].slice(Math.max(0, 2 - nextRight));
    pinnedColumnCountRef.current = left;
    pinnedRightColumnCountRef.current = nextRight;
    reactGridRef.current?.slickGrid.setOptions({
      pinning: { columns: { left: left >= 0 ? left : [], right: rightIds } },
    });
    setPinnedColumnCount(left);
    setPinnedRightColumnCount(nextRight);
  }

  function reapplyPinnedColumns() {
    const left = pinnedColumnCountRef.current;
    const right = pinnedRightColumnCountRef.current;
    const rightIds = ['cityOfOrigin', 'action'].slice(Math.max(0, 2 - right));
    reactGridRef.current?.slickGrid.setOptions({ pinning: { columns: { left: left >= 0 ? left : [], right: rightIds } } });
  }

  function toggleRightPinning() {
    setPinnedColumns(pinnedColumnCount, pinnedRightColumnCount > 0 ? 0 : 1);
  }

  function toggleSelectAllRow() {
    const next = !isSelectAllShownAsColumnTitle;
    setIsSelectAllShownAsColumnTitle(next);
    checkboxSelectorRef.current?.setOptions({ hideInColumnTitleRow: !next, hideInFilterHeaderRow: next });
  }

  function setLargePinnedColumns() {
    reactGridRef.current?.gridStateService?.applyColumnLayout?.(
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
    setPinnedColumns(pinnedColumnCount, pinnedRightColumnCount);
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 20: Pinned Columns/Rows
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example20.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>

      <div className="subtitle">
        This example demonstrates the use of Pinned (aka pinned) Columns and/or Rows (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/pinning" target="_blank">
          Docs
        </a>
        )
        <ul>
          <li>Option to pin any number of columns (left only) or rows</li>
          <li>Option to pin the rows at the bottom instead of the top (default)</li>
          <li>You can also dynamically any of these options, through SlickGrid "setOptions()"</li>
          <li>Possibility to change the styling of the line border between pinned columns/rows</li>
        </ul>
      </div>

      <br />

      <div className="row gx-2 mb-2 align-items-end">
        <div className="col-auto">
          <label htmlFor="">Pinned Rows (top/bottom): </label>
          <select
            className="form-select form-select-sm d-inline-block w-auto pinned-top-row-count"
            value={pinnedTopRowCount}
            onChange={(e) => updatePinnedRowCount(+e.currentTarget.value, 'top')}
          >
            {[0, 1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          <select
            className="form-select form-select-sm d-inline-block w-auto pinned-bottom-row-count"
            value={pinnedBottomRowCount}
            onChange={(e) => updatePinnedRowCount(+e.currentTarget.value, 'bottom')}
          >
            {[0, 1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <label htmlFor="">Pinned Columns (left/right): </label>
          <select
            className="form-select form-select-sm d-inline-block w-auto pinned-left-column-count"
            value={pinnedColumnCount}
            onChange={(e) => setPinnedColumns(+e.currentTarget.value, pinnedRightColumnCount)}
          >
            <option value={-1}>None</option>
            {[0, 1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          <select
            className="form-select form-select-sm d-inline-block w-auto pinned-right-column-count"
            value={pinnedRightColumnCount}
            onChange={(e) => setPinnedColumns(pinnedColumnCount, +e.currentTarget.value)}
          >
            {[0, 1, 2].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-sm-12">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            onClick={() => removePinnedColumns()}
            data-test="remove-pinned-column-button"
          >
            <i className="mdi mdi-close"></i> Remove Pinned Columns
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            onClick={() => setPinnedColumns(2, pinnedRightColumnCount)}
            data-test="set-3pinned-columns"
          >
            <i className="mdi mdi-pin-outline"></i> Pin 3 Columns
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            onClick={() => toggleRightPinning()}
            data-test="toggle-pinned-right"
          >
            <i className="mdi mdi-pin-outline"></i> Toggle Pinned Right
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            data-test="toggle-select-all-row"
            onClick={() => toggleSelectAllRow()}
          >
            <i className="mdi mdi-checkbox-marked-circle-outline"></i> Toggle Select All
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            data-test="set-large-pinned-columns"
            onClick={() => setLargePinnedColumns()}
          >
            <i className="mdi mdi-arrow-expand-horizontal"></i> Set Large Columns
          </button>
        </div>
      </div>

      <div className="col-sm-12">
        <hr />
      </div>

      <SlickgridReact
        gridId="grid20"
        columns={columns}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onValidationError={($event) => onCellValidationError($event.detail.eventData, $event.detail.args)}
      />
    </div>
  );
};

export default Example20;
