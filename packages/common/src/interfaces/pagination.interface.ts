import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type { PaginationService } from '../services/pagination.service.js';
import type { TranslaterService } from '../services/translater.service.js';
import type { SlickGrid } from '../core/slickGrid.js';

export interface Pagination {
  /** Current page number that we are we currently displaying. */
  pageNumber?: number;

  /** The available page sizes */
  pageSizes?: number[];

  /** Current page size chosen */
  pageSize: number;

  /** The full total count of items for the entire dataset */
  totalItems?: number;
}

export class BasePaginationComponent {
  constructor(_elmRef?: any) { }

  dispose(): void { }

  init(
    _grid: SlickGrid,
    _paginationService: PaginationService,
    _pubSubService: BasePubSubService,
    _translaterService?: TranslaterService | undefined
  ): void { }

  renderPagination(_containerElm: HTMLElement): void { }
}

export interface PaginationMetadata extends Pagination {
  /** How many pages do we have in total to display the entire dataset? */
  pageCount?: number;

  /** Current From count (which displayed items are we starting from) */
  dataFrom?: number;

  /** Current To count (which displayed items are we ending to) */
  dataTo?: number;
}
