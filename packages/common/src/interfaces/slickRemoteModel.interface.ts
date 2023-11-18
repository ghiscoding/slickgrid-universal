import type { Column } from './column.interface';
import type { SlickEvent } from '../core/index';

/**
 * A sample AJAX remote data store implementation.
 * Right now, it's hooked up to load search results from Octopart, but can
 * easily be extended to support any JSONP-compatible backend that accepts paging parameters.
 */
export interface SlickRemoteModel {
  data: any[];

  /** Constructor of the Remote Model */
  constructor: () => void;

  /** clear the dataset */
  clear(): void;

  /** is the data loaded from index x to y */
  isDataLoaded(from: number, to: number): boolean;

  /** ensure that we have data from index x to y */
  ensureData(from: number, to: number): void;

  /** reload the data from index x to y */
  reloadData(from: number, to: number): void;

  /** set the sorting column and direction */
  setSort(column: Column, direction: number): void;

  /** set the search string */
  setSearch(column: Column, direction: number): void;

  // --
  // Events

  /** triggered when the data is currently loading */
  onDataLoading: SlickEvent<{ from: number; to: number; }>;

  /** triggered when the data is loaded */
  onDataLoaded: SlickEvent<{ from: number; to: number; }>;
}
