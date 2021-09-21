export interface Aggregator {
  /** Column definition field Id of the associated Aggregator */
  field: number | string;

  /** Result valut of the Aggregator (what is the current sum, avg, ...) */
  result: any;

  /** Type of Aggregator (sum, avg, ...) */
  type: string;

  /** Aggregator initialize method */
  init: (item?: any, isParentTree?: boolean) => void;

  /** Method to accumulate the result which will be different for each Aggregator type */
  accumulate?: (item: any, isParentTreeAccumlate?: boolean, childCount?: number) => void;

  /** Method to store the result into the given group total object provided as argument */
  storeResult: (groupTotals: any | undefined, isParentTreeStoring?: boolean) => void;
}
