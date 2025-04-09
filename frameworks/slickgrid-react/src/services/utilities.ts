import type { EventSubscription } from '@slickgrid-universal/common';

/**
 * Loop through and dispose of all subscriptions when they are disposable
 * @param subscriptions
 * @return empty array
 */
export function disposeAllSubscriptions(subscriptions: Array<EventSubscription>): Array<EventSubscription> {
  if (Array.isArray(subscriptions)) {
    while (subscriptions.length > 0) {
      const subscription = subscriptions.pop() as EventSubscription;
      if ((subscription as EventSubscription)?.unsubscribe) {
        (subscription as EventSubscription).unsubscribe!();
      }
    }
  }
  return subscriptions;
}
