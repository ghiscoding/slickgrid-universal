#### index
- [Usage](#usage)
- [Changing Addon Options Dynamically](#changing-addon-options-dynamically)
- [Calling Addon Methods Dynamically](#calling-addon-methods-dynamically)
- [Row Detail - Preload Component - Loading Spinner](#row-detail---preload-component-loading-spinner)
- [Row Detail - View Component](#row-detail---view-component)
- [Access Parent Component (grid) from the Child Component (row detail)](#access-parent-component-grid-from-the-child-component-row-detail)
- Troubleshooting
  - [Adding a Column dynamically is removing the Row Selection, why is that?](#adding-a-column-dynamically-is-removing-the-row-selection-why-is-that)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example21) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example21.ts)

### Description
A Row Detail allows you to open a detail panel which can contain extra and/or more detailed information about a row. For example, we have a user list but we want to display detailed information about this user (his full address, account info, last purchasers, ...) but these are extra details that we don't want to display this in the user grid (for performance and real estate reasons)... so a Row Detail is perfect for that use case.

> **NOTE** Please note that because of the complexity behind Row Detail, the following features cannot be mixed with Row Detail because they will cause UI problems
> - Grouping
> - Pagination
> - Tree Data
> - RowSpan

> **NOTE 2** Also please note that because SlickGrid is using its built-in Virtual Scroll feature by default (for perf reasons), this will call render and re-render multiple times and that happens whenever the Row Detail gets out of the grid viewport.
> For this reason, you should avoid using dynamic elements (i.e. form inputs) because whenever a re-render kicks in, it will reset and re-render these elements as if nothing happened.
> So you should consider using Row Detail mainly for showing static data (hence where its name comes from "Row Detail" to show more detailed info) and even though it works with dynamic elements, you have to know its limitation.

## Usage

##### Component
```ts
import {
  type Column,
  createDomElement,
  Filters,
  Formatters,
  type GridOption,
  SlickEventHandler,
  Editors,
  ExtensionName,
} from '@slickgrid-universal/common';
import { SlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';

export default class Example21 {
  gridOptions!: GridOption;
  columnDefinitions!: Column<Item>[];
  dataset!: Item[];
  rowDetail!: SlickRowDetailView;
  sgb!: SlickVanillaGridBundle;

  attached() {
    this.defineGrids();

    // mock some data (different in each dataset)
    this.dataset = this.mockData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`.grid21`) as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(this.gridContainerElm, this.columnDefinitions, this.gridOptions, this.dataset);
  }

  defineGrid() {
    this.columnDefinitions = [/*...*/];

    this.gridOptions = {
      enableRowDetailView: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      preRegisterExternalExtensions: (pubSubService) => {
        // Row Detail View is a special case because of its requirement to create extra column definition dynamically
        // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
        this.rowDetail = new SlickRowDetailView(pubSubService);
        return [{ name: ExtensionName.rowDetailView, instance: this.rowDetail }];
      },
      rowDetailView: {
        // We can load the "process" asynchronously via Fetch, Promise, ...
        process: (item) => http.get(`api/item/${item.id}`),

        // load only once and reuse the same item detail without calling process method
        loadOnce: true,

        // limit expanded row to only 1 at a time
        singleRowExpand: false,

        // false by default, clicking anywhere on the row will open the detail view
        // when set to false, only the "+" icon would open the row detail
        // if you use editor or cell navigation you would want this flag set to false (default)
        useRowClick: true,

        // pre-template is typically used to show a loading spinner
        preTemplate: this.loadingTemplate.bind(this),

        // post-template is the final HTML template
        postTemplate: this.loadView.bind(this),

        // how many grid rows do we want to use for the detail panel
        // also note that the detail view adds an extra 1 row for padding purposes
        // example, if you choosed 6 panelRows, the display will in fact use 5 rows
        panelRows: this.detailViewRowCount,

        // make only every 2nd row an expandable row,
        // by using the override function to provide custom logic of which row is expandable
        // you can override it here in the options or externally by calling the method on the plugin instance
        expandableOverride: (_row, dataContext) => dataContext.id % 2 === 1,

        // Optionally pass your Parent Component reference to your Child Component (row detail component)
        parentRef: this
      }
    };
  }

   /** Loading template, can be an HTML string or an HTML Element */
  loadingTemplate() {
    const headerElm = createDomElement('h5', { className: 'title is-5' });
    headerElm.appendChild(createDomElement('i', { className: 'mdi mdi-load mdi-spin-1s mdi-40px' }));
    headerElm.appendChild(document.createTextNode('Loading...'));

    return headerElm;
  }

  /** Row Detail View, can be an HTML string or an HTML Element (we'll use HTML string for simplicity of the demo) */
  loadView(itemDetail: ItemDetail) {
    return `
      <div>
        <h4 class="title is-4">${itemDetail.title}</h4>
        <div class="container">
          <div class="columns">
            <div class="column is-half">
            <div class="detail"><label>Assignee:</label> <input class="input is-small is-8 column mt-1" id="assignee_${itemDetail.id}" type="text" value="${itemDetail.assignee}"/></div>
              <div class="detail"><label>Reporter:</label> <span>${itemDetail.reporter}</span></div>
              <div class="detail"><label>Duration:</label> <span>${itemDetail.duration}</span></div>
              <div class="detail"><label>% Complete:</label> <span>${itemDetail.percentComplete}</span></div>
              <div class="detail"><label>Start:</label> <span>${itemDetail.start.toDateString()}</span></div>
              <div class="detail"><label>Finish:</label> <span>${itemDetail.finish.toDateString()}</span></div>
              <div class="detail"><label>Effort Driven:</label> <span>${itemDetail.effortDriven}</span></div>
            </div>
            <div class="column is-half">
              <div class="detail">
                <span class="is-flex is-align-items-center">
                  <label>Find out who is the Assignee</label>
                  <button class="button is-small" id="who-is-assignee_${itemDetail.id}" data-test="assignee-btn">Click Me</button>
                </span>
                <button class="button is-small is-danger ml-5" id="delete_row_${itemDetail.id}" data-test="delete-btn">
                  Delete Row
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
```

### Changing Addon Options Dynamically
Row Detail is an addon (commonly known as a plugin and are opt-in addon), because this is not built-in SlickGrid and instead are opt-in, we need to get the instance of that addon object. Once we have the instance, we can use `getOptions` and `setOptions` to get/set any of the addon options, adding `rowDetail` with intellisense should give you this info.

#### Examples
- Dynamically change the Detail View Row Count (how many grid rows do we want to use for the row detail panel)
```ts
changeDetailViewRowCount() {
  const options = this.rowDetail.getOptions();
  if (options?.panelRows) {
    options.panelRows = this.detailViewRowCount; // change number of rows dynamically
    this.rowDetail.setOptions(options);
  }
}
```

### Calling Addon Methods Dynamically
Same as previous paragraph, after we get the SlickGrid addon instance, we can call any of the addon methods, adding `rowDetail` with intellisense should give you this info.

#### Examples
- Dynamically close all Row Detail Panels
```ts
closeAllRowDetail() {
  this.rowDetail.collapseAll();
}
```
- Dynamically close a single Row Detail by it's grid index
This requires a bit more work, you can call the method `collapseDetailView(item)` but it requires to pass the row item object (data context) and it feasible but it's just more work as can be seen below.
```ts
closeRowDetail(gridRowIndex: number) {
  if (this.sgb) {
    const rowDetailInstance = this.sgb.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
    const item = this.sgb.gridService.getDataItemByRowIndex(gridRowIndex);
    rowDetailInstance.collapseDetailView(item);
  }
}
```

### Row Detail - Preload Component (loading spinner)
Most of the time we would get data asynchronously, during that time we can show a loading spinner to the user via the `preloadComponent` grid option. We could use this simple Preload Component example as shown below

###### Preload Component
```ts
/** Loading template, can be an HTML string or an HTML Element */
loadingTemplate() {
  const headerElm = createDomElement('h5', { className: 'title is-5' });
  headerElm.appendChild(createDomElement('i', { className: 'mdi mdi-load mdi-spin-1s mdi-40px' }));
  headerElm.appendChild(document.createTextNode('Loading...'));

  return headerElm;
}
```

### Row Detail - ViewModel
Same concept as the preload, we pass an HTML template to render our Row Detail.

```ts
/** Row Detail View, can be an HTML string or an HTML Element (we'll use HTML string for simplicity of the demo) */
loadView(itemDetail: ItemDetail) {
  return `
    <div>
      ${itemDetail.name}
      ...
    </div>
  `;
}
```

###### Row Detail Component

The best is to see the Example 21 code.

[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example21) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example21.ts)

###### Grid Definition
```ts
export class Example {
  defineGrid() {
    this.gridOptions = {
      enableRowDetailView: true,
      preRegisterExternalExtensions: (pubSubService) => {
        // Row Detail View is a special case because of its requirement to create extra column definition dynamically
        // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
        const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);
        return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
      },
      rowDetailView: {
        // We can load the "process" asynchronously via Fetch, Promise, ...
        process: (item) => http.get(`api/item/${item.id}`),

        // ...

        // Preload Component
        preTemplate: this.loadingTemplate.bind(this),

        // Row Detail Component to load when row detail data is ready
        postTemplate: this.loadView.bind(this),

        // Optionally pass your Parent Component reference to your Child Component (row detail component)
        parentRef: this
      }
    };
  }
}
```