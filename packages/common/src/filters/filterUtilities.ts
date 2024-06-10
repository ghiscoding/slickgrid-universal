import { createDomElement, htmlEncodeWithPadding, } from '@slickgrid-universal/utils';

import { Constants } from '../constants';
import type { Column, GridOption, Locale, OperatorDetail } from '../interfaces/index';
import type { Observable, RxJsFacade, Subject, Subscription } from '../services/rxjsFacade';
import { castObservableToPromise, getDescendantProperty, getTranslationPrefix, } from '../services/utilities';
import type { TranslaterService } from '../services/translater.service';
import type { SlickGrid } from '../core';

/**
 * Create and return a select dropdown HTML element with a list of Operators with descriptions
 * @param {Array<Object>} optionValues - list of operators and their descriptions
 * @returns {Object} selectElm - Select Dropdown HTML Element
 */
export function buildSelectOperator(optionValues: OperatorDetail[], grid: SlickGrid): HTMLSelectElement {
  const selectElm = createDomElement('select', { className: 'form-control' });

  for (const option of optionValues) {
    const optionElm = document.createElement('option');
    optionElm.value = option.operator;
    grid.applyHtmlCode(optionElm, `${htmlEncodeWithPadding(option.operatorAlt || option.operator, 3)}${option.descAlt || option.desc}`);
    selectElm.appendChild(optionElm);
  }

  return selectElm;
}

/**
 * When user use a CollectionAsync we will use the returned collection to render the filter DOM element
 * and reinitialize filter collection with this new collection
 */
export function renderDomElementFromCollectionAsync(collection: any[], columnDef: Column, renderDomElementCallback: (collection: any) => void): void {
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
    } else if (response?.status >= 200 && response.status < 300 && typeof response.json === 'function') {
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
export function createCollectionAsyncSubject(columnDef: Column, renderDomElementCallback: (collection: any) => void, rxjs?: RxJsFacade, subscriptions?: Subscription[]): void {
  const columnFilter = columnDef?.filter ?? {};
  const newCollectionAsync = rxjs?.createSubject<any>();
  columnFilter.collectionAsync = newCollectionAsync;
  if (subscriptions && newCollectionAsync) {
    subscriptions.push(
      newCollectionAsync.subscribe(collection => renderDomElementFromCollectionAsync(collection, columnDef, renderDomElementCallback))
    );
  }
}

/** Get Locale, Translated or a Default Text if first two aren't detected */
function getOutputText(translationKey: string, localeText: string, defaultText: string, gridOptions: GridOption, translaterService?: TranslaterService): string {
  if (gridOptions?.enableTranslate && translaterService?.translate) {
    const translationPrefix = getTranslationPrefix(gridOptions);
    return translaterService.translate(`${translationPrefix}${translationKey}`);
  }
  const locales = gridOptions.locales || Constants.locales;
  return locales?.[localeText as keyof Locale] ?? defaultText;
}

/** returns common list of string related operators and their associated translation descriptions */
export function compoundOperatorString(gridOptions: GridOption, translaterService?: TranslaterService): OperatorDetail[] {
  const operatorList: OperatorDetail[] = [
    { operator: '', desc: getOutputText('CONTAINS', 'TEXT_CONTAINS', 'Contains', gridOptions, translaterService) },
    { operator: '<>', desc: getOutputText('NOT_CONTAINS', 'TEXT_NOT_CONTAINS', 'Not Contains', gridOptions, translaterService) },
    { operator: '=', desc: getOutputText('EQUALS', 'TEXT_EQUALS', 'Equals', gridOptions, translaterService) },
    { operator: '!=', desc: getOutputText('NOT_EQUAL_TO', 'TEXT_NOT_EQUAL_TO', 'Not equal to', gridOptions, translaterService) },
    { operator: 'a*', desc: getOutputText('STARTS_WITH', 'TEXT_STARTS_WITH', 'Starts with', gridOptions, translaterService) },
    { operator: '*z', desc: getOutputText('ENDS_WITH', 'TEXT_ENDS_WITH', 'Ends with', gridOptions, translaterService) },
  ];

  return operatorList;
}

/** returns common list of numeric related operators and their associated translation descriptions */
export function compoundOperatorNumeric(gridOptions: GridOption, translaterService?: TranslaterService): OperatorDetail[] {
  const operatorList: OperatorDetail[] = [
    { operator: '', desc: '' },
    { operator: '=', desc: getOutputText('EQUAL_TO', 'TEXT_EQUAL_TO', 'Equal to', gridOptions, translaterService) },
    { operator: '<', desc: getOutputText('LESS_THAN', 'TEXT_LESS_THAN', 'Less than', gridOptions, translaterService) },
    { operator: '<=', desc: getOutputText('LESS_THAN_OR_EQUAL_TO', 'TEXT_LESS_THAN_OR_EQUAL_TO', 'Less than or equal to', gridOptions, translaterService) },
    { operator: '>', desc: getOutputText('GREATER_THAN', 'TEXT_GREATER_THAN', 'Greater than', gridOptions, translaterService) },
    { operator: '>=', desc: getOutputText('GREATER_THAN_OR_EQUAL_TO', 'TEXT_GREATER_THAN_OR_EQUAL_TO', 'Greater than or equal to', gridOptions, translaterService) },
    { operator: '<>', desc: getOutputText('NOT_EQUAL_TO', 'TEXT_NOT_EQUAL_TO', 'Not equal to', gridOptions, translaterService) }
  ];

  return operatorList;
}

// internal function to apply Operator detail alternate texts when they exists
export function applyOperatorAltTextWhenExists(gridOptions: GridOption, operatorDetailList: OperatorDetail[], filterType: 'text' | 'numeric'): void {
  if (gridOptions.compoundOperatorAltTexts) {
    for (const opDetail of operatorDetailList) {
      if (gridOptions.compoundOperatorAltTexts.hasOwnProperty(filterType)) {
        const altTexts = gridOptions.compoundOperatorAltTexts[filterType]![opDetail.operator];
        opDetail['operatorAlt'] = altTexts?.operatorAlt || '';
        opDetail['descAlt'] = altTexts?.descAlt || '';
      }
    }
  }
}