## Description

Infinite scrolling allows the grid to lazy-load rows from the server (or locally) when reaching the scroll bottom (end) position.
In its simplest form, the more the user scrolls down, the more rows will get loaded and appended to the in-memory dataset.

### Demo
[JSON Data - Demo Page](https://ghiscoding.github.io/aurelia-slickgrid/#/slickgrid/example28) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/tree/master/src/examples/slickgrid/example28.ts)

[OData Backend Service - Demo Page](https://ghiscoding.github.io/aurelia-slickgrid/#/slickgrid/example26) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/tree/master/src/examples/slickgrid/example26.ts)

[GraphQL Backend Service - Demo Page](https://ghiscoding.github.io/aurelia-slickgrid/#/slickgrid/example27) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/tree/master/src/examples/slickgrid/example27.ts)

> ![WARNING]
> Pagination Grid Preset (`presets.pagination`) is **not** supported with Infinite Scroll

## Infinite Scroll with JSON data

As describe above, when used with a local JSON dataset, it will add data to the in-memory dataset whenever we scroll to the bottom until we reach the end of the dataset (if ever).

#### Code Sample
When used with a local JSON dataset, the Infinite Scroll is a feature that must be implemented by yourself. You implement by subscribing to 1 main event (`onScroll`) and if you want to reset the data when Sorting then you'll also need to subscribe to the (`onSort`) event. So the idea is to have simple code in the `onScroll` event to detect when we reach the scroll end  and then use the DataView `addItems()` to append data to the existing dataset (in-memory) and that's about it.

```ts
export class Example {
  scrollEndCalled = false;

  constructor() {
    // we're using a Binding Service but that will most probably be different on your end
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.defineGrid();

    // bind any of the grid events
    this._bindingEventService.bind(gridContainerElm, 'onsort', this.handleOnSort.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onscroll', this.handleOnScroll.bind(this));
  }

  // add onScroll listener which will detect when we reach the scroll end
  // if so, then append items to the dataset
  handleOnScroll(event) {
    const args = event.detail?.args;
    const viewportElm = args.grid.getViewportNode();
    if (
      ['mousewheel', 'scroll'].includes(args.triggeredBy || '')
      && !this.scrollEndCalled
      && viewportElm.scrollTop > 0
      && Math.ceil(viewportElm.offsetHeight + args.scrollTop) >= args.scrollHeight
    ) {
      // onScroll end reached, add more items
      // for demo purposes, we'll mock next subset of data at last id index + 1
      const startIdx = this.sgb.dataView?.getItemCount() || 0;
      const newItems = this.loadData(startIdx, FETCH_SIZE);
      this.sgb.dataView?.addItems(newItems);
      this.scrollEndCalled = false; //
    }
  }

  // do we want to reset the dataset when Sorting?
  // if answering Yes then use the code below
  handleOnSort() {
    if (this.shouldResetOnSort) {
      const newData = this.loadData(0, FETCH_SIZE);
      this.sgb.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScroll end triggered
      this.sgb.dataView?.setItems(newData);
      this.sgb.dataView?.reSort();
    }
  }
}
```

---

## Infinite Scroll with Backend Services

As describe above, when used with the Backend Service API, it will add data to the in-memory dataset whenever we scroll to the bottom. However there is one thing to note that might surprise you which is that even if Pagination is hidden in the UI, but the fact is that behind the scene that is exactly what it uses (mainly the Pagination Service `.goToNextPage()` to fetch the next set of data).

#### Code Sample
We'll use the OData Backend Service to demo Infinite Scroll with a Backend Service, however the implementation is similar for any Backend Services. The main difference with the Infinite Scroll implementation is around the `onProcess` and the callback that we use within (which is the `getCustomerCallback` in our use case). This callback will receive a data object that include the `infiniteScrollBottomHit` boolean property, this prop will be `true` only on the 2nd and more passes which will help us make a distinction between the first page load and any other subset of data to append to our in-memory dataset. With this property in mind, we'll assign the entire dataset on 1st pass with `this.sgb.dataset = data.value` (when `infiniteScrollBottomHit: false`) but for any other passes, we'll want to use the DataView `addItems()` to append data to the existing dataset (in-memory) and that's about it.

```ts
export class Example {
  initializeGrid() {
    this.columnDefinitions = [ /* ... */ ];

    this.gridOptions = {
      presets: {
        // NOTE: pagination preset is NOT supported with infinite scroll
        // filters: [{ columnId: 'gender', searchTerms: ['female'] }]
      },
      backendServiceApi: {
        service: new GridOdataService(), // or any Backend Service
        options: {
          // enable infinite scroll via Boolean OR via { fetchSize: number }
          infiniteScroll: { fetchSize: 30 }, // or use true, in that case it would use default size of 25

        preProcess: () => {
          this.displaySpinner(true);
        },
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (response) => {
          this.displaySpinner(false);
          this.getCustomerCallback(response);
        },
        // we could use local in-memory Filtering (please note that it only filters against what is currently loaded)
        // that is when we want to avoid reloading the entire dataset every time
        // useLocalFiltering: true,
      } as OdataServiceApi,
    };
  }

  // Web API call
  getCustomerApiCall(odataQuery) {
    // regular Http Client call
    return this.http.createRequest(`/api/customers?${odataQuery}`).asGet().send().then(response => response.content);

    // or with Fetch Client
    // return this.http.fetch(`/api/customers?${odataQuery}`).then(response => response.json());
  }

  getCustomerCallback(data: { '@odata.count': number; infiniteScrollBottomHit: boolean; metrics: Metrics; query: string; value: any[]; }) {
    // totalItems property needs to be filled for pagination to work correctly
    const totalItemCount: number = data['@odata.count'];
    this.metricsTotalItemCount = totalItemCount;

    // even if we're not showing pagination, it is still used behind the scene to fetch next set of data (next page basically)
    // once pagination totalItems is filled, we can update the dataset
    this.sgb.paginationOptions!.totalItems = totalItemCount;

    // infinite scroll has an extra data property to determine if we hit an infinite scroll and there's still more data (in that case we need append data)
    // or if we're on first data fetching (no scroll bottom ever occured yet)
    if (!data.infiniteScrollBottomHit) {
      // initial load not scroll hit yet, full dataset assignment
      this.sgb.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScrollEnd event triggering
      this.sgb.dataset = data.value;
    } else {
      // scroll hit, for better perf we can simply use the DataView directly for better perf (which is better compare to replacing the entire dataset)
      this.sgb.dataView?.addItems(data.value);
    }
  }
}
```