import { ObservableFacade } from '@slickgrid-universal/common';
import { Observable, Subscription } from 'rxjs';

// export const EMPTYUniversal = EMPTY;

export class ObservableWrapper<T> implements ObservableFacade<T> {
  private observer: Observable<T>;

  constructor() {
    this.observer = new Observable();
  }

  pipe(fns?: any): Observable<T> {
    return this.observer.pipe(fns);
  }

  // subscribe(observer?: any): any { }
  subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.observer.subscribe(next, error, complete);
  }
}