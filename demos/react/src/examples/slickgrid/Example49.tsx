import React, { useEffect, useRef, useState } from 'react';
import {
  Editors,
  SlickgridReact,
  SlickSelectionUtils,
  type Column,
  type GridOption,
  type OnDragReplaceCellsEventArgs,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import './example49.scss'; // provide custom CSS/SASS styling

const NB_ITEMS = 100;

const Example49: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [dataset] = useState(getData(NB_ITEMS));
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();

    // make sure it's back to light mode before unmounting
    return () => {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'selector',
        name: '',
        field: 'num',
        width: 30,
      },
    ];

    for (let i = 0; i < NB_ITEMS; i++) {
      columnDefinitions.push({
        id: i,
        name:
          i < 26
            ? String.fromCharCode('A'.charCodeAt(0) + (i % 26))
            : String.fromCharCode('A'.charCodeAt(0) + Math.floor(i / 26) - 1) + String.fromCharCode('A'.charCodeAt(0) + (i % 26)),
        field: String(i),
        minWidth: 60,
        width: 60,
        editor: { model: Editors.text },
      });
    }

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      darkMode,
      editable: true,
      headerRowHeight: 35,
      // rowHeight: 30,
      editorNavigateOnArrows: true, // enable editor navigation using arrow keys

      // enable new hybrid selection model (rows & cells)
      enableSelection: true,
      selectionOptions: {
        selectActiveRow: true,
        rowSelectColumnIds: ['selector'],
      },

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        copyActiveEditorCell: true,
        removeDoubleQuotesOnPaste: true,
        replaceNewlinesWith: ' ',
      },
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  /** Copy the dragged cell values to other cells that are part of the extended drag-fill selection */
  function copyDraggedCellRange(args: OnDragReplaceCellsEventArgs) {
    const verticalTargetRange = SlickSelectionUtils.verticalTargetRange(args.prevSelectedRange, args.selectedRange);
    const horizontalTargetRange = SlickSelectionUtils.horizontalTargetRange(args.prevSelectedRange, args.selectedRange);
    const cornerTargetRange = SlickSelectionUtils.cornerTargetRange(args.prevSelectedRange, args.selectedRange);

    if (verticalTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, verticalTargetRange, args.grid);
    }
    if (horizontalTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, horizontalTargetRange, args.grid);
    }
    if (cornerTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, cornerTargetRange, args.grid);
    }
  }

  function getData(itemCount: number) {
    // mock a dataset
    const datasetTmp: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const d: any = (datasetTmp[i] = {});
      d['id'] = i;
      d['num'] = i;
    }

    return datasetTmp;
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    toggleBodyBackground(newDarkMode);
    reactGridRef.current?.slickGrid.setOptions({ darkMode: newDarkMode });
  }

  function toggleBodyBackground(darkMode: boolean) {
    if (darkMode) {
      document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
  }

  return !gridOptions ? (
    ''
  ) : (
    <div className="demo49">
      <h2>
        Example 49: Spreadsheet Drag-Fill
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example49.tsx"
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
        <button className="btn btn-outline-secondary btn-sm btn-icon ms-2" onClick={() => toggleDarkMode()} data-test="toggle-dark-mode">
          <span className="mdi mdi-theme-light-dark"></span>
          <span>Toggle Dark Mode</span>
        </button>
      </h2>

      <div className="subtitle">
        Spreadsheet with drag-fill, hybrid selection model. Type a few values in the grid and then select those cells and use the bottom
        right drag handle spread the selection and auto-fill the values to other cells. Use <code>onDragReplaceCells</code> event to
        customize the drag-fill behavior. Use
        <code>&lcub; enableSelection: true, selectionOptions: &lcub; selectionType: 'mixed' &rcub;&rcub;</code>
        grid option to enable the new Hybrid Selection Model.
      </div>

      <br />

      <div id="grid-container" className="col-sm-12">
        <SlickgridReact
          gridId="grid49"
          columns={columnDefinitions}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
          onDragReplaceCells={($event) => copyDraggedCellRange($event.detail.args)}
        />
      </div>
    </div>
  );
};

export default Example49;
