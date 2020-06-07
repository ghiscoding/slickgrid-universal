import { SlickEvent, SlickEventData } from './index';

/**
 * TypeScript Helper to get the Generic Type T of the SlickEvent<T>
 * for example GetType<SlickEvent<{ columnDef: Column }>> will return { columnDef: Column }
 */
export type GetSlickEventType<T> = T extends (infer U)[] ? U : T extends (...args: any[]) => infer U ? U : T extends SlickEvent<infer U> ? U : T;

type Handler<H> = (e: SlickEventData, data: H) => void

export interface SlickEventHandler<T = any> {
  /** Subscribe to a SlickGrid Event and execute its handler callback */
  subscribe: (slickEvent: SlickEvent<T>, handler: Handler<T>) => SlickEventHandler<T>;

  /** Unsubscribe to a SlickGrid Event and execute its handler callback */
  unsubscribe: (slickEvent: SlickEvent<T>, handler: Handler<T>) => SlickEventHandler<T>;

  /** Unsubscribe and remove all SlickGrid Event Handlers */
  unsubscribeAll: () => SlickEventHandler<T>;
}
