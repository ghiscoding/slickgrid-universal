import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type { PaginationService } from '../services/pagination.service';
import type { TranslaterService } from '../services/translater.service';
import type { SlickGrid } from '../core/slickGrid';

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

export abstract class BasePaginationComponent {
  constructor(
    _grid: SlickGrid,
    _paginationService: PaginationService,
    _pubSubService: BasePubSubService,
    _translaterService?: TranslaterService | undefined
  ) { }

  dispose(): void { }

  render(_containerElm: HTMLElement): void { }
}