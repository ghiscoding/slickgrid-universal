import { SubscriptionFacade } from '@slickgrid-universal/common';
import { Subscription, TeardownLogic } from 'rxjs';

export class SubscriptionWrapper implements SubscriptionFacade {
  private subscriber;

  constructor() {
    this.subscriber = new Subscription();
  }

  /** Disposes the resources held by the subscription */
  unsubscribe(): void {
    this.subscriber.unsubscribe();
  }

  /** Adds a tear down to be called during the unsubscribe() of this Subscription. */
  add(teardown: TeardownLogic): Subscription {
    return this.subscriber.add(teardown);
  }

  /** Removes a Subscription from the internal list of subscriptions. */
  remove(subscription: Subscription): void {
    return this.subscriber.remove(subscription);
  }
}