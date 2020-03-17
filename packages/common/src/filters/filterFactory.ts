import { ColumnFilter, Filter } from '../interfaces/index';
import { SlickgridConfig } from '../slickgrid-config';
import { CollectionService } from '../services/collection.service';
import { TranslaterService } from '../services/translater.service';

export class FilterFactory {
  /**
   * The options from the SlickgridConfig
   */
  private _options: any;

  constructor(private config: SlickgridConfig, private collectionService: CollectionService, private translaterService: TranslaterService) {
    this._options = this.config.options;
  }

  // Uses the User model to create a new User
  createFilter(columnFilter: ColumnFilter | undefined): Filter | undefined {
    let filter: Filter | undefined;

    if (columnFilter && columnFilter.model) {
      filter = typeof columnFilter.model === 'function' ? new columnFilter.model(this.collectionService, this.translaterService) : columnFilter.model;
    }

    // fallback to the default filter
    if (!filter && this._options.defaultFilter) {
      filter = new this._options.defaultFilter(this.collectionService, this.translaterService);
    }

    return filter;
  }
}
