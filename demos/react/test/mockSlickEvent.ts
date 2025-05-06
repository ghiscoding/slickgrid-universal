import type { SlickEvent, SlickEventHandler } from '@slickgrid-universal/common';

// interface PubSubEvent {
//   name: string;
//   handler: (args: any) => void;
// }

// @ts-ignore
export class MockSlickEvent implements SlickEvent {
  private _handlers: any[] = [];

  notify(args: any, event?: any, scope?: any) {
    scope = scope || this;

    let returnValue;
    for (let i = 0; i < this._handlers.length; i++) {
      returnValue = this._handlers[i].call(scope, event, args);
    }

    return returnValue;
  }

  subscribe(handler: (data: any, e?: any) => void): any {
    this._handlers.push(handler);
  }

  unsubscribe(handler: (data: any, e?: any) => void) {
    this._handlers.forEach((handlerFn, index) => {
      if (handlerFn === handler) {
        this._handlers.splice(index, 1);
      }
    });
  }
}

export class MockSlickEventHandler implements SlickEventHandler {
  private _handlers: any[] = [];

  notify(eventName: string, data?: any) {
    const pubSub: any = this._handlers.find((subscription: any) => subscription.name === eventName);
    if (typeof pubSub?.handler === 'function') {
      pubSub.handler(data);
    }
  }

  subscribe(event: SlickEvent<any>, handler: (data: any, e?: any) => void): any {
    this._handlers.push({
      event,
      handler,
    });
    if (event.subscribe) {
      event.subscribe(handler);
    }

    return this;
  }

  // @ts-ignore
  unsubscribe(event: SlickEvent<any>, handler: (data: any, e: any) => void) {
    let i = this._handlers.length;
    while (i--) {
      if (this._handlers[i].event === event && this._handlers[i].handler === handler) {
        this._handlers.splice(i, 1);
        if (event.unsubscribe) {
          event.unsubscribe(handler);
        }
        break;
      }
    }

    return this; // allow chaining
  }

  // @ts-ignore
  unsubscribeAll() {
    let i = this._handlers.length;
    while (i--) {
      if (this._handlers[i].event.unsubscribe) {
        this._handlers[i].event.unsubscribe(this._handlers[i].handler);
      }
    }
    this._handlers = [];

    return this; // allow chaining
  }
}
