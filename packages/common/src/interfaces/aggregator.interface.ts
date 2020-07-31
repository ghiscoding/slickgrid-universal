export interface Aggregator {
  /** Aggregator associated Field Id */
  field?: number | string;

  /** Aggregator associated type */
  type?: string;

  /** Aggregator initialize method */
  init: () => void;

  /** Mathod to accumulate the result with different logic depending on each aggregator type */
  accumulate?: (item: any) => void;

  /** Method to store the result into the given group total argument provided */
  storeResult?: (groupTotals: any | undefined) => void;
}
