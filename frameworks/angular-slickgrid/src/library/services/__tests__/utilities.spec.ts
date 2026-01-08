import { of, type Subscription } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { unsubscribeAllObservables } from '../utilities.js';

describe('Service/Utilies', () => {
  describe('unsubscribeAllObservables method', () => {
    it('should return original array when array of subscriptions is empty', () => {
      const input = [];
      unsubscribeAllObservables([]);
      expect(input.length).toBe(0);
    });

    it('should return unique values when input array has duplicate objects', () => {
      const subscriptions: Subscription[] = [];
      const observable1 = of([1, 2]);
      const observable2 = of([1, 2]);
      subscriptions.push(observable1.subscribe(), observable2.subscribe());
      unsubscribeAllObservables(subscriptions);
      expect(subscriptions).toHaveLength(0);
    });
  });
});
