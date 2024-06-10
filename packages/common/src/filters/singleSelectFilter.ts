import { SelectFilter } from './selectFilter';
import type { CollectionService } from './../services/collection.service';
import type { TranslaterService } from '../services/translater.service';
import type { RxJsFacade } from '../services/rxjsFacade';

export class SingleSelectFilter extends SelectFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService?: TranslaterService | undefined, protected readonly collectionService?: CollectionService | undefined, protected readonly rxjs?: RxJsFacade | undefined) {
    super(translaterService, collectionService, rxjs, false);
  }
}
