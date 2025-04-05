import type { IBindingContext } from '@aurelia/runtime';
import type { ICustomElementController } from '@aurelia/runtime-html';

import {
  AureliaUtilService,
  type Column,
  type ColumnFilter,
  emptyElement,
  type Filter,
  type FilterArguments,
  type FilterCallback,
  type GridOption,
  OperatorType,
  type OperatorString,
  type SearchTerm,
  type SlickGrid,
  type ViewModelBindableInputData,
} from 'aurelia-slickgrid';

export class CustomAureliaViewModelFilter implements Filter {
  private _shouldTriggerQuery = true;
  container!: HTMLDivElement;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;
  operator: OperatorType | OperatorString = OperatorType.equal;

  /** Aurelia ViewModel Reference */
  vm?: { controller?: ICustomElementController } | null;
  elmBindingContext?: IBindingContext;

  /** Aurelia Util Service (could be inside the Grid Options Params or the Filter Params ) */
  get aureliaUtilService(): AureliaUtilService {
    let aureliaUtilService = this.gridOptions?.params?.aureliaUtilService;
    if (!aureliaUtilService || !(aureliaUtilService instanceof AureliaUtilService)) {
      aureliaUtilService = this.columnFilter?.params?.aureliaUtilService;
    }
    return aureliaUtilService;
  }

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

    if (!this.columnFilter?.params?.viewModel) {
      throw new Error(`[Aurelia-Slickgrid] For the Filters.aureliaComponent to work properly, you need to fill in the "viewModel" property of your Custom Element Filter.
      Example: this.columnDefs = [{ id: 'title', field: 'title', filter: { model: CustomFilter, collection: [...], param: { viewModel: MyVM } },`);
    }

    if (this.columnFilter.params.viewModel) {
      this.container = this.grid.getHeaderRowColumn(this.columnDef.id);
      emptyElement(this.container);

      // provide model binding including collection and selectedItem callback, we can use this binding in createAureliaViewModelAddToSlot()
      const bindableData = {
        grid: this.grid,

        // here we override the collection object of the Aurelia Custom Element
        // but technically you can pass any values you wish as bindings
        model: {
          collection: this.collection,
        },
      } as ViewModelBindableInputData;
      const viewModel = this.columnFilter.params.viewModel;
      this.vm = await this.aureliaUtilService.createAureliaViewModelAddToSlot(viewModel, bindableData, this.container);
      this.elmBindingContext = this.vm?.controller?.children?.[0].scope.bindingContext;

      // override the FilterSelect selectedItemChanged method (from the @bindable() selectedItem), we'll trigger the filter callback
      if (this.elmBindingContext) {
        this.elmBindingContext.selectedItemChanged = ((item: any) => {
          this.callback(undefined, { columnDef: this.columnDef, operator: this.operator, searchTerms: [item.id], shouldTriggerQuery: this._shouldTriggerQuery });
          // reset flag for next use
          this._shouldTriggerQuery = true;
        });
      }
    }
  }

  /** Clear the filter value */
  clear(shouldTriggerQuery = true) {
    this._shouldTriggerQuery = shouldTriggerQuery;
    if (this.elmBindingContext?.selectedItem) {
      this.elmBindingContext.selectedItem = { id: '', name: '' };
    }
  }

  /** destroy the Aurelia Custom Element & Subscription */
  destroy() {
    this.vm?.controller?.deactivate(this.vm.controller, null);
    this.container = this.grid.getHeaderRowColumn(this.columnDef.id);
    emptyElement(this.container);
  }

  /** Set value(s) on the DOM element */
  setValues(values: any) {
    if (this.elmBindingContext?.selectedItem) {
      this.elmBindingContext.selectedItem = values;
    }
  }
}
