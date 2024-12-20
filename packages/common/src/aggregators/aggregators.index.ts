import { AvgAggregator } from './avgAggregator.js';
import { CloneAggregator } from './cloneAggregator.js';
import { CountAggregator } from './countAggregator.js';
import { DistinctAggregator } from './distinctAggregator.js';
import { MinAggregator } from './minAggregator.js';
import { MaxAggregator } from './maxAggregator.js';
import { SumAggregator } from './sumAggregator.js';
import type { AggregatorConstructor } from '../interfaces/aggregator.interface.js';

/** Provides a list of different Aggregators for the Group Formatter */
export const Aggregators: Record<string, AggregatorConstructor> = {
  /** Average Aggregator which calculate the average of a given group */
  Avg: AvgAggregator,

  /** Clone Aggregator will simply clone (copy) over the last defined value of a given group */
  Clone: CloneAggregator,

  /** Count Aggregator will count the number of rows in the group */
  Count: CountAggregator,

  /** Distinct Aggregator will return an array of distinct values found inside the given group */
  Distinct: DistinctAggregator,

  /** Minimum Aggregator which will find the minimum value inside the given group */
  Min: MinAggregator,

  /** Maximum Aggregator which will find the maximum value inside the given group */
  Max: MaxAggregator,

  /** Sum Aggregator which calculate the sum of a given group */
  Sum: SumAggregator,
};
