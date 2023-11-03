import { Column, FieldType, Filters, Formatters, GridOption, SlickEventHandler, SlickNamespace, } from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

const NB_ITEMS = 100;
declare const Slick: SlickNamespace;

interface ShadowContainer {
  shadow: ShadowRoot;
  gridContainer: HTMLDivElement;
}

export default class Example20 {
  protected _eventHandler: SlickEventHandler;

  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  gridOptions!: GridOption;
  gridContainerElm: HTMLDivElement;
  isWithPagination = true;
  sgb: SlickVanillaGridBundle;

  attached() {
    this._eventHandler = new Slick.EventHandler();
    const shadowObj = this.createShadowElement();

    // define the grid options & columns and then create the grid itself
    this.defineGrid(shadowObj);

    // mock some data (different in each dataset)
    this.dataset = this.getData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`#host`) as HTMLDivElement;
    document.body.classList.add('salesforce-theme');

    // not sure why but ShadowDOM seems a little slower to render,
    // let's wrap the grid resize in a delay & show the grid only after the resize
    setTimeout(() => {
      this.sgb = new Slicker.GridBundle(shadowObj.gridContainer as HTMLDivElement, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
      this.sgb.resizerService.resizeGrid();
      shadowObj.gridContainer.style.opacity = '1';
    }, 50);
  }

  /**
   * Build the Shadow DOM. In this example, it will
   * have just a div for the grid, and a <link>
   * for the Alpine style.
   *
   * Notice that the <link> tag must be placed inside
   * the Shadow DOM tree, it cannot be placed on the <head>
   * tag because the Shadow DOM is unaffected by external
   * styles
   */
  createShadowElement(): ShadowContainer {
    const host = document.querySelector('#host') as HTMLDivElement;
    const shadow = host.attachShadow({ mode: 'open' });
    const gridContainer = document.createElement('div');
    // gridContainer.style.width = '600px';
    // gridContainer.style.height = '500px';
    gridContainer.style.opacity = '0';
    gridContainer.classList.add('grid20');
    shadow.appendChild(gridContainer);

    const linkElement = document.createElement('link');
    linkElement.type = 'text/css';
    linkElement.rel = 'stylesheet';
    linkElement.href = './assets/styles.css';
    shadow.appendChild(linkElement);
    return { shadow, gridContainer };
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this.sgb?.dispose();
    this.gridContainerElm.remove();
    document.body.classList.remove('salesforce-theme');
  }

  /* Define grid Options and Columns */
  defineGrid(shadowObj) {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100, filterable: true, type: FieldType.number },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100, filterable: true, type: FieldType.number },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, filter: { model: Filters.compoundDate }, type: FieldType.date, exportWithFormatter: true, filterable: true },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, filter: { model: Filters.compoundDate }, type: FieldType.date, exportWithFormatter: true, filterable: true },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100, filterable: true }
    ];

    this.gridOptions = {
      gridHeight: 450,
      gridWidth: 800,
      enableCellNavigation: true,
      enableFiltering: true,
      headerRowHeight: 35,
      rowHeight: 30,
      shadowRoot: shadowObj.shadow
    };
  }

  getData(itemCount: number) {
    // mock a dataset
    const datasetTmp: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      datasetTmp.push({
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        effortDriven: (i % 5 === 0)
      });
    }

    return datasetTmp;
  }

  generatePhoneNumber(): string {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }

  // Toggle the Grid Pagination
  // IMPORTANT, the Pagination MUST BE CREATED on initial page load before you can start toggling it
  // Basically you cannot toggle a Pagination that doesn't exist (must created at the time as the grid)
  togglePagination() {
    this.isWithPagination = !this.isWithPagination;
    this.sgb.paginationService!.togglePaginationVisibility(this.isWithPagination);
    this.sgb.slickGrid!.setSelectedRows([]);
  }
}
