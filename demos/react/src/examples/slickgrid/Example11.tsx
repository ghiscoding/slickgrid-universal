import React, { useEffect, useRef, useState } from 'react';
import {
  Editors,
  Formatters,
  SlickgridReact,
  type Column,
  type GridOption,
  type OnEventArgs,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import './example11.scss';

const Example11: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
    getData(1000);
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
    // if you want to change background color of Duration over 50 right after page load,
    // you would put the code here, also make sure to re-render the grid for the styling to be applied right away
    /*
    dataView.getItemMetadata = updateItemMetadataForDurationOver50(dataView.getItemMetadata);
    grid.invalidate();
    */
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'delete',
        field: 'id',
        excludeFromHeaderMenu: true,
        formatter: Formatters.icon,
        params: { iconCssClass: 'mdi mdi-trash-can pointer' },
        minWidth: 30,
        maxWidth: 30,
        // use onCellClick OR grid.onClick.subscribe which you can see down below
        onCellClick: (_e: Event, args: OnEventArgs) => {
          console.log(args);
          if (confirm('Are you sure?')) {
            reactGridRef.current?.gridService.deleteItemById(args.dataContext.id);
          }
        },
      },
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        editor: {
          model: Editors.longText,
        },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        type: 'number',
        editor: {
          model: Editors.text,
        },
        onCellChange: (_e: Event, args: OnEventArgs) => {
          alert('onCellChange directly attached to the column definition');
          console.log(args);
        },
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        formatter: Formatters.percentCompleteBar,
        type: 'number',
        editor: {
          model: Editors.integer,
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
        /*
        editor: {
          model: Editors.date
        }
        */
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        type: 'number',
        editor: {
          model: Editors.checkbox,
        },
      },
    ];

    setColumnDefinitions(columnDefinitions);
    setGridOptions({
      asyncEditorLoading: false,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      editable: true,
      enableColumnPicker: true,
      enableCellNavigation: true,
      enableSelection: true,
    });
  }

  function getData(itemCount: number) {
    // mock a dataset
    const mockedDataset: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockedDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }
    setDataset(mockedDataset);
  }

  function addNewItem(insertPosition?: 'top' | 'bottom') {
    const newItem1 = createNewItem(1);
    // const newItem2 = createNewItem(2);

    // single insert
    reactGridRef.current?.gridService.addItem(newItem1, { position: insertPosition });

    // OR multiple inserts
    // reactGrid.gridService.addItems([newItem1, newItem2], { position: insertPosition });
  }

  function createNewItem(incrementIdByHowMany = 1) {
    const dataset = reactGridRef.current!.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId = highestId + incrementIdByHowMany;
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    return {
      id: newId,
      title: 'Task ' + newId,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 2, randomDay),
      effortDriven: true,
    };
  }

  /** Change the Duration Rows Background Color */
  function changeDurationBackgroundColor() {
    reactGridRef.current!.dataView.getItemMetadata = updateItemMetadataForDurationOver40(reactGridRef.current!.dataView.getItemMetadata);
    // also re-render the grid for the styling to be applied right away
    reactGridRef.current!.slickGrid.invalidate();
    // or use the SlickGrid-React GridService
    // gridService.renderGrid();
  }

  /** Highlight the 5th row using the Slickgrid-React GridService */
  function highlighFifthRow() {
    scrollGridTop();
    reactGridRef.current?.gridService.highlightRow(4, 1500);
  }

  /**
   * Change the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 40
   * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
   */
  function updateItemMetadataForDurationOver40(previousItemMetadata: any) {
    const newCssClass = 'duration-bg';
    return (rowNumber: number) => {
      const item = reactGridRef.current!.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: '',
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }
      if (meta && item && item.duration) {
        const duration = +item.duration; // convert to number
        if (duration > 40) {
          meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
        }
      }
      return meta;
    };
  }

  function updateSecondItem() {
    scrollGridTop();
    const updatedItem = reactGridRef.current?.gridService.getDataItemByRowNumber(1);
    updatedItem.duration = Math.round(Math.random() * 100);
    reactGridRef.current?.gridService.updateItem(updatedItem);

    // OR by id
    // reactGridRef.current?.gridService.updateItemById(updatedItem.id, updatedItem);

    // OR multiple changes
    /*
    const updatedItem1 = reactGridRef.current?.gridService.getDataItemByRowNumber(1);
    const updatedItem2 = reactGridRef.current?.gridService.getDataItemByRowNumber(2);
    updatedItem1.duration = Math.round(Math.random() * 100);
    updatedItem2.duration = Math.round(Math.random() * 100);
    reactGridRef.current?.gridService.updateItems([updatedItem1, updatedItem2], { highlightRow: true });
    */
  }

  function scrollGridBottom() {
    reactGridRef.current?.slickGrid.navigateBottom();
  }

  function scrollGridTop() {
    reactGridRef.current?.slickGrid.navigateTop();
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? null : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 11: Add / Update / Highlight a Datagrid Item
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example11.tsx"
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
        Add / Update / Hightlight an Item from the Datagrid (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/add-update-highlight" target="_blank">
          Docs
        </a>
        ).
        <ul>
          <li>
            <b>Note:</b> this demo is <b>only</b> on the datagrid (client) side, you still need to deal with the backend yourself
          </li>
          <li>Adding an item, will always be showing as the 1st item in the grid because that is the best visual place to add it</li>
          <li>Add/Update an item requires a valid Slickgrid Selection Model, you have 2 choices to deal with this:</li>
          <ul>
            <li>You can enable "enableCheckboxSelector" or "enableSelection" to True</li>
          </ul>
          <li>Click on any of the buttons below to test this out</li>
          <li>
            You can change the highlighted color &amp; animation by changing the{' '}
            <a
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss"
              target="_blank"
            >
              SASS Variables
            </a>
          </li>
          <ul>
            <li>"$row-highlight-background-color" or "$row-highlight-fade-animation"</li>
          </ul>
          <li>You can also add CSS class(es) on the fly (or on page load) on rows with certain criteria, (e.g. click on last button)</li>
          <ul>
            <li>
              Example, click on button "Highlight Rows with Duration over 50" to see row styling changing.{' '}
              <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/dynamic-item-metadata" target="_blank">
                Wiki doc
              </a>
            </li>
          </ul>
        </ul>
      </div>

      <div className="col-sm-12">
        <span>
          <label>Scroll: </label>
          <div className="btn-group mx-1" role="group" aria-label="...">
            <button className="btn btn-sm btn-outline-secondary btn-icon" data-test="scroll-top-btn" onClick={() => scrollGridTop()}>
              <i className="mdi mdi-arrow-down mdi-rotate-180"></i>
            </button>
            <button className="btn btn-sm btn-outline-secondary btn-icon" data-test="scroll-bottom-btn" onClick={() => scrollGridBottom()}>
              <i className="mdi mdi-arrow-down"></i>
            </button>
          </div>
          <button className="btn btn-sm btn-outline-secondary btn-icon" data-test="add-new-item-top-btn" onClick={() => addNewItem('top')}>
            Add New Mocked Item (top)
          </button>
          <button
            className="btn btn-sm btn-outline-secondary mx-1"
            data-test="add-new-item-bottom-btn"
            onClick={() => addNewItem('bottom')}
          >
            Add New Mocked Item (bottom)
          </button>
          <button
            className="btn btn-sm btn-outline-secondary btn-icon"
            data-test="update-second-item-btn"
            onClick={() => updateSecondItem()}
          >
            Update 2nd Row Item with Random Duration
          </button>
          <button className="btn btn-sm btn-outline-secondary mx-1" data-test="highlight-row5-btn" onClick={() => highlighFifthRow()}>
            Highlight 5th Row
          </button>
          <button
            className="btn btn-sm btn-outline-secondary btn-icon"
            data-test="highlight-duration40-btn"
            onClick={() => changeDurationBackgroundColor()}
          >
            Highlight Rows with Duration over 50
          </button>
        </span>
        <hr />
      </div>

      <SlickgridReact
        gridId="grid11"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default Example11;
