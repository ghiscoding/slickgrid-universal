export interface Aggregator {
  /** Column definition field Id of the associated Aggregator */
  field: number | string;

  /** Was the Aggregator already initialized? */
  isInitialized?: boolean;

  /** Type of Aggregator (sum, avg, ...) */
  type: string;

  /** Aggregator initialize method */
  init: (item?: any, isTreeAggregator?: boolean) => void;

  /** Method to accumulate the result which will be different for each Aggregator type */
  accumulate?: (item: any, isTreeParent?: boolean) => void;

  /** Method to store the result into the given group total object provided as argument */
  storeResult: (groupTotals: any | undefined) => void;
}

export interface AggregatorConstructor {
  new (field: number | string): Aggregator;
}
