import { OperatorString } from '../enums/operatorString.type';
import { Column, GridOption } from '../interfaces/index';
import { Observable, RxJsFacade, Subject, Subscription } from '../services/rxjsFacade';
import { createDomElement, htmlEncodedStringWithPadding, sanitizeTextByAvailableSanitizer, } from '../services/domUtilities';
import { castObservableToPromise, getDescendantProperty, } from '../services/utilities';

/**
 * Create and return a select dropdown HTML element with a list of Operators with descriptions
 * @param {Array<Object>} optionValues - list of operators and their descriptions
 * @returns {Object} selectElm - Select Dropdown HTML Element
 */
export function buildSelectOperator(optionValues: Array<{ operator: OperatorString, description: string }>, gridOptions: GridOption): HTMLSelectElement {
  const selectElm = createDomElement('select', { className: 'form-control' });

  for (const option of optionValues) {
    selectElm.appendChild(
      createDomElement('option', {
        value: option.operator,
        innerHTML: sanitizeTextByAvailableSanitizer(gridOptions, `${htmlEncodedStringWithPadding(option.operator, 3)}${option.description}`)
      })
    );
  }

  return selectElm;
}

/**
 * When user use a CollectionAsync we will use the returned collection to render the filter DOM element
 * and reinitialize filter collection with this new collection
 */
export function renderDomElementFromCollectionAsync(collection: any[], columnDef: Column, renderDomElementCallback: (collection: any) => void) {
  const columnFilter = columnDef?.filter ?? {};
  const collectionOptions = columnFilter?.collectionOptions ?? {};

  if (collectionOptions && collectionOptions.collectionInsideObjectProperty) {
    const collectionInsideObjectProperty = collectionOptions.collectionInsideObjectProperty;
    collection = getDescendantProperty(collection, collectionInsideObjectProperty as string);
  }
  if (!Array.isArray(collection)) {
    throw new Error(`Something went wrong while trying to pull the collection from the "collectionAsync" call in the Filter, the collection is not a valid array.`);
  }

  // copy over the array received from the async call to the "collection" as the new collection to use
  // this has to be BEFORE the `collectionObserver().subscribe` to avoid going into an infinite loop
  columnFilter.collection = collection;

  // recreate Multiple Select after getting async collection
  renderDomElementCallback(collection);
}

export async function renderCollectionOptionsAsync(collectionAsync: Promise<any | any[]> | Observable<any | any[]> | Subject<any | any[]>, columnDef: Column, renderDomElementCallback: (collection: any) => void, rxjs?: RxJsFacade, subscriptions?: Subscription[]): Promise<any[]> {
  const columnFilter = columnDef?.filter ?? {};
  const collectionOptions = columnFilter?.collectionOptions ?? {};

  let awaitedCollection: any = null;

  if (collectionAsync) {
    const isObservable = rxjs?.isObservable(collectionAsync) ?? false;
    if (isObservable && rxjs) {
      awaitedCollection = await castObservableToPromise(rxjs, collectionAsync) as Promise<any>;
    }

    // wait for the "collectionAsync", once resolved we will save it into the "collection"
    const response: any | any[] = await collectionAsync;

    if (Array.isArray(response)) {
      awaitedCollection = response; // from Promise
    } else if (response instanceof Response && typeof response['json'] === 'function') {
      awaitedCollection = await response['json'](); // from Fetch
    } else if (response && response['content']) {
      awaitedCollection = response['content']; // from http-client
    }

    if (!Array.isArray(awaitedCollection) && collectionOptions?.collectionInsideObjectProperty) {
      const collection = awaitedCollection || response;
      const collectionInsideObjectProperty = collectionOptions.collectionInsideObjectProperty;
      awaitedCollection = getDescendantProperty(collection, collectionInsideObjectProperty || '');
    }

    if (!Array.isArray(awaitedCollection)) {
      throw new Error('Something went wrong while trying to pull the collection from the "collectionAsync" call in the Filter, the collection is not a valid array.');
    }

    // copy over the array received from the async call to the "collection" as the new collection to use
    // this has to be BEFORE the `collectionObserver().subscribe` to avoid going into an infinite loop
    columnFilter.collection = awaitedCollection;

    // recreate Multiple Select after getting async collection
    renderDomElementCallback(awaitedCollection);

    // because we accept Promises & HttpClient Observable only execute once
    // we will re-create an RxJs Subject which will replace the "collectionAsync" which got executed once anyway
    // doing this provide the user a way to call a "collectionAsync.next()"
    if (isObservable) {
      createCollectionAsyncSubject(columnDef, renderDomElementCallback, rxjs, subscriptions);
    }
  }

  return awaitedCollection;
}

/** Create or recreate an Observable Subject and reassign it to the "collectionAsync" object so user can call a "collectionAsync.next()" on it */
export function createCollectionAsyncSubject(columnDef: Column, renderDomElementCallback: (collection: any) => void, rxjs?: RxJsFacade, subscriptions?: Subscription[]) {
  const columnFilter = columnDef?.filter ?? {};
  const newCollectionAsync = rxjs?.createSubject<any>();
  columnFilter.collectionAsync = newCollectionAsync;
  if (subscriptions && newCollectionAsync) {
    subscriptions.push(
      newCollectionAsync.subscribe(collection => renderDomElementFromCollectionAsync(collection, columnDef, renderDomElementCallback))
    );
  }
}

