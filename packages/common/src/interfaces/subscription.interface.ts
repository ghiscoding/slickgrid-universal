export interface EventSubscription {
  /** Disposes the subscription. */
  dispose?: () => void;

  /** Disposes the resources held by the subscription. */
  unsubscribe?: () => void;
}
