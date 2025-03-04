import type { ColumnFilter, Filter } from '../interfaces/index.js';
import type { SlickgridConfig } from '../slickgrid-config.js';
import type { CollectionService } from '../services/collection.service.js';
import type { TranslaterService } from '../services/translater.service.js';
import type { RxJsFacade } from '../services/rxjsFacade.js';

export class FilterFactory {
  /** The options from the SlickgridConfig */
  protected _options: any;

  constructor(
    protected config: SlickgridConfig,
    protected readonly translaterService?: TranslaterService | undefined,
    protected readonly collectionService?: CollectionService | undefined,
    protected rxjs?: RxJsFacade | undefined
  ) {
    this._options = this.config?.options ?? {};
  }

  addRxJsResource(rxjs: RxJsFacade): void {
    this.rxjs = rxjs;
  }

  // Uses the User model to create a new User
  createFilter(columnFilter?: ColumnFilter): Filter | undefined {
    let filter: Filter | undefined;

    if (columnFilter?.model) {
      // prettier-ignore
      filter = typeof columnFilter.model === 'function' ? new columnFilter.model(this.translaterService, this.collectionService, this.rxjs) : columnFilter.model;
    }

    // fallback to the default filter
    if (!filter && this._options.defaultFilter) {
      filter = new this._options.defaultFilter(this.translaterService, this.collectionService, this.rxjs);
    }

    return filter;
  }
}
