import {
  type Column,
  FieldType,
  type Formatter,
  Formatters,
  type GridOption,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import DOMPurify from 'dompurify';
import { useState } from 'react';

interface DataItem {
  id: number;
  title: string;
  duration: string;
  percentComplete: number;
  percentComplete2: number;
  start: Date;
  finish: Date;
  effortDriven: boolean;
  phone: string;
  completed: number;
}

// create my custom Formatter with the Formatter type
const myCustomCheckmarkFormatter: Formatter<DataItem> = (_row, _cell, value) => {
  // you can return a string of a object (of type FormatterResultObject), the 2 types are shown below
  return value
    ? `<i class="mdi mdi-fire red" aria-hidden="true"></i>`
    : { text: '<i class="mdi mdi-snowflake" aria-hidden="true"></i>', addClasses: 'lightblue', toolTip: 'Freezing' };
};

const customEnableButtonFormatter: Formatter<DataItem> = (_row: number, _cell: number, value: any) => {
  return `<span style="margin-left: 5px">
      <button class="btn btn-xs btn-default">
        <i class="mdi ${value ? 'mdi-check-circle' : 'mdi-circle'}" style="color: ${value ? 'black' : 'lavender'}"></i>
      </button>
    </span>`;
};

const Example2: React.FC = () => {
  const [reactGrid, setReactGrid] = useState<SlickgridReactInstance>();
  const [resizerPaused, setResizerPaused] = useState(false);
  const [dataset] = useState(getData());
  const [hideSubTitle, setHideSubTitle] = useState(false);

  // the columns field property is type-safe, try to add a different string not representing one of DataItems properties
  const columnDefinitions: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string, width: 70 },
    {
      id: 'phone',
      name: 'Phone Number using mask',
      field: 'phone',
      sortable: true,
      type: FieldType.number,
      minWidth: 100,
      formatter: Formatters.mask,
      params: { mask: '(000) 000-0000' },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      formatter: Formatters.decimal,
      params: { minDecimal: 1, maxDecimal: 2 },
      sortable: true,
      type: FieldType.number,
      minWidth: 90,
      exportWithFormatter: true,
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      type: FieldType.number,
      sortable: true,
      minWidth: 100,
    },
    {
      id: 'percent2',
      name: '% Complete',
      field: 'percentComplete2',
      formatter: Formatters.progressBar,
      type: FieldType.number,
      sortable: true,
      minWidth: 100,
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      sortable: true,
      type: FieldType.date,
      minWidth: 90,
      exportWithFormatter: true,
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      sortable: true,
      type: FieldType.date,
      minWidth: 90,
      exportWithFormatter: true,
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      formatter: myCustomCheckmarkFormatter,
      type: FieldType.number,
      sortable: true,
      minWidth: 100,
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      type: FieldType.number,
      sortable: true,
      minWidth: 100,
      formatter: customEnableButtonFormatter,
      onCellClick: (_e, args) => {
        toggleCompletedProperty(args?.dataContext);
      },
    },
  ];

  const gridOptions: GridOption = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableCellNavigation: true,
    showCustomFooter: true, // display some metrics in the bottom custom footer
    customFooterOptions: {
      // optionally display some text on the left footer container
      leftFooterText: 'custom footer text',
      hideTotalItemCount: true,
      hideLastUpdateTimestamp: true,
    },
    // sanitize is returning a different TrustedHTML type, not sure why but we can cast as string to avoid build issue, the result will still be TrustedHTML
    sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),

    // you customize all formatter at once certain options through "formatterOptions" in the Grid Options
    // or independently through the column definition "params", the option names are the same
    /*
    formatterOptions: {
      dateSeparator: '.',
      decimalSeparator: ',',
      displayNegativeNumberWithParentheses: true,
      minDecimal: 0,
      maxDecimal: 2,
      thousandSeparator: '_'
    },
    */

    // when using the ExcelCopyBuffer, you can see what the selection range is
    enableExcelCopyBuffer: true,
    // excelCopyBufferOptions: {
    //   onCopyCells: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCells', args.ranges),
    //   onPasteCells: (e, args: { ranges: SelectedRange[] }) => console.log('onPasteCells', args.ranges),
    //   onCopyCancelled: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCancelled', args.ranges),
    // }
  };

  // mock a dataset
  function getData() {
    const mockDataset: any[] = [];

    for (let i = 0; i < 500; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        phone: generatePhoneNumber(),
        duration: i % 33 === 0 ? null : Math.random() * 100 + '',
        percentComplete: randomPercent,
        percentComplete2: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }
    return mockDataset;
  }

  function generatePhoneNumber(): string {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }

  function reactGridReady(instance: SlickgridReactInstance) {
    setReactGrid(instance);
  }

  function togglePauseResizer() {
    const isPaused = !resizerPaused;
    setResizerPaused(isPaused);
    reactGrid?.resizerService.pauseResizer(isPaused);
  }

  function toggleCompletedProperty(item: any) {
    // toggle property
    if (typeof item === 'object') {
      item.completed = !item.completed;

      // simulate a backend http call and refresh the grid row after delay
      window.setTimeout(() => {
        reactGrid?.gridService.updateItemById(item.id, item, { highlightRow: false });
      }, 250);
    }
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGrid?.resizerService.resizeGrid(0);
  }

  return (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 2: Grid with Formatters
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example2.tsx"
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
        Grid with Custom and/or included Slickgrid Formatters (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/column-functionalities/formatters" target="_blank">
          Docs
        </a>
        ).
        <ul>
          <li>The 2 last columns are using Custom Formatters</li>
          <ul>
            <li>The "Completed" column uses a the "onCellClick" event and a formatter to simulate a toggle action</li>
          </ul>
          <li>
            Support Excel Copy Buffer (SlickGrid Copy Manager Plugin), you can use it by simply enabling "enableExcelCopyBuffer" flag. Note
            that it will only evaluate Formatter when the "exportWithFormatter" flag is enabled (through "ExcelExportOptions" or
            "TextExportOptions" or the column definition)
          </li>
          <li>This example also has auto-resize enabled, and we also demo how you can pause the resizer if you wish to</li>
        </ul>
      </div>

      <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={() => togglePauseResizer()}>
        Pause auto-resize: <b>{resizerPaused + ''}</b>
      </button>

      <SlickgridReact
        gridId="grid2"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default Example2;
