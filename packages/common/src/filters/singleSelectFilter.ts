import { SelectFilter } from './selectFilter';
import { CollectionService } from './../services/collection.service';
import { TranslaterService } from '../services/translater.service';
import { RxJsFacade } from '../services/rxjsFacade';

export class SingleSelectFilter extends SelectFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService: TranslaterService, protected readonly collectionService: CollectionService, protected readonly rxjs?: RxJsFacade) {
    super(translaterService, collectionService, rxjs, false);
  }
}
