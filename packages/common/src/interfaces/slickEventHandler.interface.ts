import type { SlickEvent, SlickEventData } from 'slickgrid';

export type Handler<H> = (e: SlickEventData, data: H) => void;

export interface SlickEventHandler {
  /** Subscribe to a SlickGrid Event and execute its handler callback */
  subscribe: <T = any>(slickEvent: SlickEvent<T>, handler: Handler<T>) => SlickEventHandler;

  /** Unsubscribe a SlickGrid Event and its handler callback */
  unsubscribe: <T = any>(slickEvent: SlickEvent<T>, handler: Handler<T>) => SlickEventHandler;

  /** Unsubscribe and remove all SlickGrid Event Handlers */
  unsubscribeAll: () => SlickEventHandler;
}
