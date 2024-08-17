import { type Column, FieldType, Filters, Formatters, type GridOption, SlickEventHandler, } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

const NB_ITEMS = 100;

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
  sgb: SlickVanillaGridBundle;

  attached() {
    this._eventHandler = new SlickEventHandler();
    const shadowObj = this.createShadowElement();

    // define the grid options & columns and then create the grid itself
    this.defineGrid(shadowObj);

    // mock some data (different in each dataset)
    this.dataset = this.getData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`#host`) as HTMLDivElement;
    document.body.classList.add('salesforce-theme');

    // not sure why but ShadowDOM seems a little slower to render,
    // let's wrap the grid resize in a delay & show the grid only after the resize
    window.setTimeout(async () => {
      this.sgb = new Slicker.GridBundle(shadowObj.gridContainer as HTMLDivElement, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
      await this.sgb.resizerService.resizeGrid(150);
      shadowObj.gridContainer.style.opacity = '1';
    }, 75);
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
    // const styleElms = document.querySelectorAll<HTMLStyleElement>('head > link[rel=stylesheet], head > style[type="text/css"]');
    const styleElms = document.querySelectorAll<HTMLStyleElement>('head > link[rel=stylesheet]');
    const styleClones = Array.from(styleElms).map(el => el.cloneNode(true));

    const host = document.querySelector('#host') as HTMLDivElement;
    const shadow = host.attachShadow({ mode: 'open' });
    const gridContainer = document.createElement('div');
    // gridContainer.style.width = '600px';
    // gridContainer.style.height = '500px';
    gridContainer.style.opacity = '0';
    gridContainer.classList.add('grid20');
    shadow.appendChild(gridContainer);
    if (styleElms.length) {
      shadow.prepend(...styleClones);
    } else {
      const linkElement = document.createElement('link');
      linkElement.type = 'text/css';
      linkElement.rel = 'stylesheet';
      linkElement.href = './src/styles.scss';
      shadow.appendChild(linkElement);
    }

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
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, filter: { model: Filters.compoundDate }, type: FieldType.dateIso, exportWithFormatter: true, filterable: true },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, filter: { model: Filters.compoundDate }, type: FieldType.dateIso, exportWithFormatter: true, filterable: true },
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
      const randomPercent = Math.round(Math.random() * 100);

      datasetTmp.push({
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: '2009-01-01',
        finish: '2009-05-05',
        effortDriven: (i % 5 === 0)
      });
    }

    return datasetTmp;
  }
}
