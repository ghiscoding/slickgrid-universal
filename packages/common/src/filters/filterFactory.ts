import { ColumnFilter, Filter } from '../interfaces/index';
import { SlickgridConfig } from '../slickgrid-config';
import { CollectionService } from '../services/collection.service';
import { TranslaterService } from '../services/translater.service';

export class FilterFactory {
  /** The options from the SlickgridConfig */
  private _options: any;

  constructor(private config: SlickgridConfig, private readonly translaterService?: TranslaterService, private readonly collectionService?: CollectionService) {
    this._options = this.config?.options ?? {};
  }

  // Uses the User model to create a new User
  createFilter(columnFilter: ColumnFilter | undefined): Filter | undefined {
    let filter: Filter | undefined;

    if (columnFilter?.model) {
      filter = typeof columnFilter.model === 'function' ? new columnFilter.model(this.translaterService, this.collectionService) : columnFilter.model;
    }

    // fallback to the default filter
    if (!filter && this._options.defaultFilter) {
      filter = new this._options.defaultFilter(this.translaterService, this.collectionService);
    }

    return filter;
  }
}
