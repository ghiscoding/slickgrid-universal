import { SelectFilter } from './selectFilter';
import type { CollectionService } from './../services/collection.service';
import type { TranslaterService } from '../services/translater.service';
import type { RxJsFacade } from '../services/rxjsFacade';

export class SingleSelectFilter extends SelectFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService?: TranslaterService, protected readonly collectionService?: CollectionService, protected readonly rxjs?: RxJsFacade) {
    super(translaterService, collectionService, rxjs, false);
  }
}
