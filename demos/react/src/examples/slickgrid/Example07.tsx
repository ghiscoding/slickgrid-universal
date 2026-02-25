import React, { useEffect, useRef, useState } from 'react';
import { SlickgridReact, type Column, type GridOption, type SlickEventData, type SlickgridReactInstance } from 'slickgrid-react';
import './example07.scss';

const Example7: React.FC = () => {
  const [gridOptions1, setGridOptions1] = useState<GridOption | undefined>(undefined);
  const [gridOptions2, setGridOptions2] = useState<GridOption | undefined>(undefined);
  const [columnDefinitions1, setColumnDefinitions1] = useState<Column[]>([]);
  const [columnDefinitions2, setColumnDefinitions2] = useState<Column[]>([]);
  const [dataset1, setDataset1] = useState<any[]>([]);
  const [dataset2, setDataset2] = useState<any[]>([]);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef1 = useRef<SlickgridReactInstance | null>(null);
  const reactGridRef2 = useRef<SlickgridReactInstance | null>(null);
  const columns1WithHighlightingById: any = {};
  const columns2WithHighlightingById: any = {};

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGrid1Ready(reactGrid: SlickgridReactInstance) {
    reactGridRef1.current = reactGrid;
  }

  function reactGrid2Ready(reactGrid: SlickgridReactInstance) {
    reactGridRef2.current = reactGrid;
  }

  function defineGrid() {
    const gridOptions1: GridOption = {
      enableAutoResize: true,
      enableHeaderButton: true,
      enableHeaderMenu: false,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: false,
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        onCopyCells: (e, args) => console.log('onCopyCells', e, args),
        onPasteCells: (e, args) => console.log('onPasteCells', e, args),
        onCopyCancelled: (e, args) => console.log('onCopyCancelled', e, args),
      },
      enableCellNavigation: true,
      gridHeight: 275,
      headerButton: {
        // you can use the "onCommand" (in Grid Options) and/or the "action" callback (in Column Definition)
        onCommand: (_e, args) => handleOnCommand(_e, args, 1),
      },
    };

    // grid 2 options, same as grid 1 + extras
    setGridOptions1(gridOptions1);
    setGridOptions2({
      ...gridOptions1,
      enableHeaderMenu: true,
      enableFiltering: true,
      // frozenColumn: 2,
      // frozenRow: 2,
      headerButton: {
        onCommand: (_e, args) => handleOnCommand(_e, args, 2),
      },
    });

    const columnDefinitions1 = createColumnDefinitions(1);
    const columnDefinitions2 = createColumnDefinitions(2);
    setColumnDefinitions1(columnDefinitions1);
    setColumnDefinitions2(columnDefinitions2);

    setDataset1(loadData(200, columnDefinitions1));
    setDataset2(loadData(200, columnDefinitions2));
  }

  function handleOnCommand(_e: SlickEventData, args: any, gridNo: 1 | 2) {
    const column = args.column;
    const button = args.button;
    const command = args.command;

    if (command === 'toggle-highlight') {
      if (button.cssClass === 'mdi mdi-lightbulb-on text-danger') {
        if (gridNo === 1) {
          delete columns1WithHighlightingById[column.id];
        } else {
          delete columns2WithHighlightingById[column.id];
        }
        button.cssClass = 'mdi mdi-lightbulb-outline text-warning faded';
        button.tooltip = 'Highlight negative numbers.';
      } else {
        if (gridNo === 1) {
          columns1WithHighlightingById[column.id] = true;
        } else {
          columns2WithHighlightingById[column.id] = true;
        }
        button.cssClass = 'mdi mdi-lightbulb-on text-danger';
        button.tooltip = 'Remove highlight.';
      }
      if (gridNo === 1) {
        reactGridRef1.current?.slickGrid.invalidate();
      } else {
        reactGridRef2.current?.slickGrid.invalidate();
      }
    }
  }

  function createColumnDefinitions(gridNo: number) {
    // Set up some test columns.
    const columnDefinitions: any[] = [];

    for (let i = 0; i < 10; i++) {
      columnDefinitions.push({
        id: i,
        name: 'Column ' + String.fromCharCode('A'.charCodeAt(0) + i),
        field: i + '',
        width: i === 0 ? 70 : 100, // have the 2 first columns wider
        filterable: true,
        sortable: true,
        formatter: (_row: number, _cell: number, value: any, columnDef: Column) => {
          if (gridNo === 1 && columns1WithHighlightingById[columnDef.id] && value < 0) {
            return `<div style="color:red; font-weight:bold;">${value}</div>`;
          } else if (gridNo === 2 && columns2WithHighlightingById[columnDef.id] && value < 0) {
            return `<div style="color:red; font-weight:bold;">${value}</div>`;
          }
          return value;
        },
        header: {
          buttons: [
            {
              cssClass: 'mdi mdi-lightbulb-outline text-warning faded',
              command: 'toggle-highlight',
              tooltip: 'Highlight negative numbers.',
              itemVisibilityOverride: (args: any) => {
                // for example don't show the header button on column "E"
                return args.column.name !== 'Column E';
              },
              itemUsabilityOverride: (args: any) => {
                // for example the button usable everywhere except on last column ='J"
                return args.column.name !== 'Column J';
              },
              action: (_e: Event, args: any) => {
                // you can use the "action" callback and/or subscribe to the "onCallback" event, they both have the same arguments
                // do something
                console.log(`execute a callback action to "${args.command}" on ${args.column.name}`);
              },
            },
          ],
        },
      });
    }

    // Set multiple buttons on the first column to demonstrate overflow.
    columnDefinitions[0].name = 'Resize me!';
    columnDefinitions[0].header = {
      buttons: [
        {
          cssClass: 'mdi mdi-message-text',
          handler: () => {
            alert('Tag');
          },
        },
        {
          cssClass: 'mdi mdi-forum-outline',
          handler: () => {
            alert('Comment');
          },
        },
        {
          cssClass: 'mdi mdi-information',
          handler: () => {
            alert('Info');
          },
        },
        {
          cssClass: 'mdi mdi-help-circle',
          handler: () => {
            alert('Help');
          },
        },
      ],
    };

    // when floating to left, you might want to inverse the icon orders
    if (gridNo === 2) {
      columnDefinitions[0].header?.buttons?.reverse();
    }

    // Set a button on the second column to demonstrate hover.
    columnDefinitions[1].name = 'Hover me!';
    columnDefinitions[1].header = {
      buttons: [
        {
          cssClass: 'mdi mdi-help-circle',
          showOnHover: true,
          tooltip: 'This button only appears on hover.',
          handler: () => {
            alert('Help');
          },
        },
      ],
    };

    return columnDefinitions;
  }

  function loadData(count: number, columnDefinitions: Column[]) {
    // mock a dataset
    const mockDataset: any[] = [];

    for (let i = 0; i < count; i++) {
      const d: any = (mockDataset[i] = {});
      d['id'] = i;
      for (let j = 0; j < columnDefinitions.length; j++) {
        d[j] = Math.round(Math.random() * 10) - 5;
      }
    }
    return mockDataset;
  }

  return !gridOptions1 ? null : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 7: Header Button Plugin
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example7.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => setHideSubTitle(!hideSubTitle)}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>

      {hideSubTitle ? null : (
        <div className="subtitle">
          This example demonstrates using the <b>SlickHeaderButtons</b> plugin to easily add buttons to colum headers. These buttons can be
          specified directly in the column definition, and are very easy to configure and use. (
          <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/header-menu-header-buttons" target="_blank">
            Docs
          </a>
          )
          <ul>
            <li>Resize the 1st column to see all icon/command</li>
            <li>Mouse hover the 2nd column to see it's icon/command</li>
            <li>For all the other columns, click on top-right red circle icon to enable highlight of negative numbers.</li>
            <li>Note: The "Header Button" & "Header Menu" Plugins cannot be used at the same time</li>
            <li>
              Use override callback functions to change the properties of show/hide, enable/disable the menu or certain item(s) from the
              list
            </li>
            <ol>
              <li>These callbacks are: "itemVisibilityOverride", "itemUsabilityOverride"</li>
              <li>for example the "Column E" does not show the header button via "itemVisibilityOverride"</li>
              <li>for example the "Column J" header button is displayed but it not usable via "itemUsabilityOverride"</li>
            </ol>
          </ul>
        </div>
      )}

      <h5>Grid 1</h5>
      <SlickgridReact
        gridId="grid7-1"
        columns={columnDefinitions1}
        options={gridOptions1}
        dataset={dataset1}
        onReactGridCreated={($event) => reactGrid1Ready($event.detail)}
      />

      <br />

      <h5>
        Grid 2 - <span className="subtitle">with both Header Buttons & Menus</span>
      </h5>
      <SlickgridReact
        gridId="grid7-2"
        columns={columnDefinitions2}
        options={gridOptions2}
        dataset={dataset2}
        onReactGridCreated={($event) => reactGrid2Ready($event.detail)}
      />
    </div>
  );
};

export default Example7;
