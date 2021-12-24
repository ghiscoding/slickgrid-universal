import { Handler, SlickEvent, SlickEventData, SlickEventHandler } from '@slickgrid-universal/common';

export class MockSlickEvent<T = any> implements SlickEvent {
  private _handlers = [];

  notify(args: T, event?: SlickEventData, scope?: any) {
    scope = scope || this;

    let returnValue;
    for (let i = 0; i < this._handlers.length; i++) {
      returnValue = this._handlers[i].call(scope, event, args);
    }

    return returnValue;
  }

  subscribe(handler: (e: SlickEventData, data: Partial<T>) => void): any {
    this._handlers.push(handler);
  }

  unsubscribe(handler: (e: SlickEventData, data?: any) => void) {
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
    const pubSub = this._handlers.find(subscription => subscription.name === eventName);
    if (typeof pubSub?.handler === 'function') {
      pubSub.handler(data);
    }
  }

  subscribe<T = any>(event: MockSlickEvent, handler: Handler<T>): any {
    this._handlers.push({ event, handler });
    if (event.subscribe) {
      event.subscribe(handler);
    }

    return this;
  }

  unsubscribe<T = any>(event: MockSlickEvent, handler: Handler<T>) {
    let i = this._handlers.length;
    while (i--) {
      if (this._handlers[i].event === event &&
        this._handlers[i].handler === handler) {
        this._handlers.splice(i, 1);
        if (event.unsubscribe) {
          event.unsubscribe(handler);
        }
        break;
      }
    }

    return this;  // allow chaining
  }

  unsubscribeAll() {
    let i = this._handlers.length;
    while (i--) {
      if (this._handlers[i].event.unsubscribe) {
        this._handlers[i].event.unsubscribe(this._handlers[i].handler);
      }
    }
    this._handlers = [];

    return this;  // allow chaining
  }
}
