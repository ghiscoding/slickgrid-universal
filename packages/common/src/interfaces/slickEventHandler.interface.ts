import type { SlickEvent, SlickEventData } from './index';

export type Handler<H> = (e: SlickEventData, data: H) => void;

export interface SlickEventHandler {
  /** Subscribe to a SlickGrid Event and execute its handler callback */
  subscribe: <T = any>(slickEvent: SlickEvent<T>, handler: Handler<T>) => this;

  /** Unsubscribe to a SlickGrid Event and execute its handler callback */
  unsubscribe: <T = any>(slickEvent: SlickEvent<T>, handler: Handler<T>) => this;

  /** Unsubscribe and remove all SlickGrid Event Handlers */
  unsubscribeAll: () => void;
}
