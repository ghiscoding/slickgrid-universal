import type { EventSubscription } from '@slickgrid-universal/common';
import type { IDisposable } from 'aurelia';

/**
 * Loop through and dispose of all subscriptions when they are disposable
 * @param subscriptions
 * @return empty array
 */
export function disposeAllSubscriptions(subscriptions: Array<EventSubscription | IDisposable>): Array<EventSubscription | IDisposable> {
  if (Array.isArray(subscriptions)) {
    while (subscriptions.length > 0) {
      const subscription = subscriptions.pop();
      if (subscription?.dispose) {
        subscription.dispose();
      } else if (typeof (subscription as EventSubscription)?.unsubscribe === 'function') {
        (subscription as EventSubscription).unsubscribe!();
      }
    }
  }
  return subscriptions;
}
