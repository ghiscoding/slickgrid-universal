import { ExcelExportService } from '@slickgrid-universal/excel-export';
import React, { useEffect, useRef, useState } from 'react';
import {
  Filters,
  Formatters,
  SlickgridReact,
  type Column,
  type Formatter,
  type GridOption,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import './example09.scss'; // provide custom CSS/SASS styling

import { Button } from '@fluentui/react-components';
import { TextExportService } from '@slickgrid-universal/text-export';
import { baseFluentGridOption } from './base-fluent-grid-options.js';
import { showToast } from './utilities.js';

interface Chapter {
  id: string;
  chapterName?: string;
  label?: string;
  description?: string;
  dateModified?: Date | string;
  pageNumber: number;
  textColor?: string;
}

interface ChapterTree extends Chapter {
  chapters?: ChapterTree[];
}

const coloredTextFormatter: Formatter = (_row: number, _cell: number, val: any, _column: Column, dataContext: Chapter) => {
  if (dataContext.textColor) {
    const span = document.createElement('span');
    span.className = dataContext.textColor;
    span.textContent = val;
    return span;
  }
  return val;
};

const FAKE_SERVER_DELAY = 1000;

const Example09: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>();
  const [datasetHierarchical] = useState(mockDataset());
  const [serverWaitDelay, setServerWaitDelay] = useState<number>(FAKE_SERVER_DELAY);

  const serverWaitDelayRef = useRef(serverWaitDelay);
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
        id: 'chapterName',
        name: 'Chapter',
        field: 'chapterName',
        width: 150,
        formatter: Formatters.tree,
        filterable: true,
        sortable: true,
      },
      {
        id: 'label',
        name: 'Label',
        field: 'label',
        minWidth: 90,
        formatter: coloredTextFormatter,
        filterable: true,
        sortable: true,
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        minWidth: 90,
        formatter: coloredTextFormatter,
        filterable: true,
        sortable: true,
      },
      {
        id: 'pageNumber',
        name: 'Page Number',
        field: 'pageNumber',
        minWidth: 90,
        type: 'number',
        exportWithFormatter: true,
        excelExportOptions: { autoDetectCellFormat: false },
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
      },
      {
        id: 'dateModified',
        name: 'Last Date Modified',
        field: 'dateModified',
        formatter: Formatters.date, // base date formatter which requires "params.dateFormat"
        params: {
          dateFormat: 'MMM DD, YYYY, h:mm:ss a',
        },
        type: 'dateUtc',
        outputType: 'dateTimeIso',
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
    ];

    const gridOptions: GridOption = {
      autoResize: {
        autoHeight: false,
        container: '#demo-container',
        rightPadding: 10,
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableCellNavigation: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true,
      },
      enableTextExport: true,
      textExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true,
      },
      enableCheckboxSelector: true,
      enableSelection: true,
      multiSelect: false,
      checkboxSelector: {
        // columnIndexPosition: 1,
        // hideInFilterHeaderRow: true,
        // hideInColumnTitleRow: false,
        onRowToggleStart: (_e, args) => console.log('onBeforeRowToggle', args),
        onSelectAllToggleStart: () => reactGridRef.current?.treeDataService.toggleTreeDataCollapse(false, false),
      },
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
      },
      externalResources: [new ExcelExportService(), new TextExportService()],
      enableFiltering: true,
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
      multiColumnSort: false, // multi-column sorting is not supported with Tree Data, so you need to disable it
      rowHeight: 35,
      showCustomFooter: true,
      treeDataOptions: {
        columnId: 'chapterName',
        childrenPropName: 'chapters',
        initiallyCollapsed: true,

        // lazy loading function
        lazy: true,
        onLazyLoad: (node: ChapterTree, resolve: (value: ChapterTree[]) => void, reject: () => void) => {
          // simulate backend fetch
          setTimeout(() => {
            if (node.label === 'lazy fetch will FAIL') {
              reject(); // simulate a reject/failure
              showToast('Lazy fetching failed', 'danger');
            } else {
              resolve(getChaptersByParentNode(node));
            }
          }, serverWaitDelayRef.current);
        },
      },
      ...baseFluentGridOption,
    };

    setColumns(columns);
    setGridOptions(gridOptions);
  }

  function collapseAll() {
    reactGridRef.current?.treeDataService.toggleTreeDataCollapse(true);
  }

  function expandAll() {
    reactGridRef.current?.treeDataService.toggleTreeDataCollapse(false);
  }

  function mockDataset(): ChapterTree[] {
    return [
      {
        id: generateGUID(),
        chapterName: 'Chapter 1',
        label: 'The intro',
        chapters: [],
        description: `it's all about the introduction`,
        pageNumber: 2,
        dateModified: '2024-03-05T12:44:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 2',
        label: 'Where it all started',
        chapters: [],
        description: 'hometown to the big city',
        pageNumber: 50,
        dateModified: '2024-04-23T08:33:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 3',
        label: 'Here I come...',
        chapters: [],
        description: 'here comes a wall',
        pageNumber: 78,
        dateModified: '2024-05-05T12:22:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 4',
        label: 'Are we there yet?',
        chapters: [],
        description: 'soon...',
        pageNumber: 120,
        dateModified: '2024-04-29T10:24:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 5',
        label: 'The finale',
        chapters: [],
        description: 'the end is near!',
        pageNumber: 155,
        dateModified: '2024-06-21T07:22:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 6',
        label: 'End',
        pageNumber: 156,
        dateModified: '2024-06-22T07:22:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter X',
        label: 'lazy fetch will FAIL',
        chapters: [],
        description: '...demo an API call error!!!',
        pageNumber: 999,
        dateModified: '2024-09-28T00:22:00.123Z',
        textColor: 'color-danger',
      },
    ];
  }

  /** simulate a backend fetching to lazy load tree, node with `chapters: []` represent a parent that can be lazily loaded */
  function getChaptersByParentNode(node: Chapter): ChapterTree[] {
    // typically you'll want to use the `node.id` to fetch its children,
    // but for our demo we'll just create some more book chapters
    const dotPrefixes = prefixDots(node.chapterName!.length - 6);
    return [
      {
        id: generateGUID(),
        chapterName: `${node.chapterName}.1`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.1`,
        chapters: [],
        pageNumber: node.pageNumber + 1,
      },
      {
        id: generateGUID(),
        chapterName: `${node.chapterName}.2`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.2`,
        chapters: [],
        pageNumber: node.pageNumber + 2,
      },
      {
        id: generateGUID(),
        chapterName: `${node.chapterName}.3`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.3`,
        pageNumber: node.pageNumber + 3,
      },
    ];
  }

  function handleServerDelayInputChange(e: React.FormEvent<HTMLInputElement>) {
    const newDelay = parseInt((e.target as HTMLInputElement)?.value, 10) ?? 0;
    setServerWaitDelay(newDelay);
    serverWaitDelayRef.current = newDelay;
  }

  /** Generate a UUID version 4 RFC compliant */
  function generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function prefixDots(count: number) {
    let result = '';
    for (let i = 0; i < count; i++) {
      result += '.';
    }
    return result;
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 9: Tree Data with Lazy Loading <small>(from a Hierarchical Dataset)</small>
      </h2>

      <div className="row">
        <div className="col-md-7">
          <Button className="btn-icon" data-test="clear-filters-btn" onClick={() => reactGridRef.current?.filterService.clearFilters()}>
            <span className="fic fic-dismiss me-1"></span>
            <span>Clear Filters</span>
          </Button>
          <Button onClick={() => collapseAll()} data-test="collapse-all-btn" className="btn-icon mx-1">
            <span className="fic fic-arrow-minimize me-1"></span>
            <span>Collapse All</span>
          </Button>
          <Button onClick={() => expandAll()} data-test="expand-all-btn" className="btn-icon">
            <span className="fic fic-arrow-maximize me-1"></span>
            <span>Expand All</span>
          </Button>
          <span className="ms-1">
            <label htmlFor="pinned-rows">Simulated Server Delay (ms): </label>
            <input
              type="number"
              id="server-delay"
              data-test="server-delay"
              style={{ height: '24px', width: '60px' }}
              value={serverWaitDelay}
              onInput={($event) => handleServerDelayInputChange($event)}
            />
          </span>
        </div>
      </div>

      <br />

      <div id="grid-container" className="col-sm-12">
        <SlickgridReact
          gridId="grid46"
          columns={columns}
          options={gridOptions}
          datasetHierarchical={datasetHierarchical}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

export default Example09;
