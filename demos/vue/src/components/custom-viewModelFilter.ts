import {
  emptyElement,
  type Column,
  type ColumnFilter,
  type Filter,
  type FilterArguments,
  type FilterCallback,
  type GridOption,
  type OperatorType,
  type SearchTerm,
  type SlickGrid,
} from 'slickgrid-vue';
import { createApp, type App, type ComponentPublicInstance } from 'vue';

interface Props {
  focus: () => void;
  hide: () => void;
  show: () => void;
  onSelectedItemChanged: (selectedItem: any) => void;
}

export class CustomVueComponentFilter implements Filter {
  /** Vue Component instance */
  compApp?: App<Element>;

  /** Vue Component instance */
  compInstance?: ComponentPublicInstance<any, Props>;

  private _shouldTriggerQuery = true;
  container!: HTMLDivElement;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;
  operator: OperatorType = 'EQ';
  selectedItem: any;

  /** Get the Collection */
  get collection(): any[] {
    return this.columnFilter?.collection ?? [];
  }

  /** Getter for the Column Filter */
  get columnFilter(): ColumnFilter {
    return this.columnDef?.filter ?? {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return (this.grid?.getOptions() ?? {}) as GridOption;
  }

  /**
   * Initialize the Filter
   */
  async init(args: FilterArguments) {
    this.grid = args.grid as SlickGrid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    this.searchTerms = (args.hasOwnProperty('searchTerms') ? args.searchTerms : []) || [];

    const component = this.columnFilter?.params?.component;
    if (!component) {
      throw new Error(`[Slickgrid-Vue] For the Filters CustomVueComponentFilter to work properly, you need to fill the "params.component" property.
      Example: this.columnDefs = [{ id: 'title', field: 'title', filter: { model: CustomVueComponentFilter, collection: [...], param: { component: MyComponent } },`);
    }

    this.container = this.grid.getHeaderRowColumn(this.columnDef.id);
    emptyElement(this.container);

    const bindableData = {
      grid: this.grid,
      model: {
        collection: this.collection,
      },
      onSelectedItemChanged: (item: any) => {
        this.callback(undefined, {
          columnDef: this.columnDef,
          operator: this.operator,
          searchTerms: [item.id],
          shouldTriggerQuery: this._shouldTriggerQuery,
        });

        // reset flag for next use
        this._shouldTriggerQuery = true;
      },
    } as Record<string, unknown>;

    const tmpDiv = document.createElement('div');
    this.compApp = createApp(component, bindableData);
    this.compInstance = this.compApp.mount(tmpDiv) as ComponentPublicInstance;
    this.container.replaceChildren(this.compInstance.$el);
  }

  /** Clear the filter value */
  clear(shouldTriggerQuery = true) {
    this._shouldTriggerQuery = shouldTriggerQuery;
    this.selectedItem = { id: '', name: '' };
    this.compInstance.setValue(this.selectedItem);
  }

  /** destroy the Aurelia Custom Element & Subscription */
  destroy() {
    this.compApp?.unmount();
    this.container = this.grid.getHeaderRowColumn(this.columnDef.id);
    emptyElement(this.container);
  }

  /** Set value(s) on the DOM element */
  setValues(values: any) {
    this.selectedItem = values;
    this.compInstance.setValue(this.selectedItem);
  }
}
