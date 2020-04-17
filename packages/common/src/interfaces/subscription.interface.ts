export interface Subscription {
  /** Disposes the subscription. */
  dispose?: () => void;

  /** Disposes the resources held by the subscription. */
  unsubscribe?: () => void;
}
