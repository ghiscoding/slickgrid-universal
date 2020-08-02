import { SlickEvent, SlickEventHandler } from '@slickgrid-universal/common';

interface PubSubEvent {
  name: string;
  handler: (args: any) => void;
}

export class MockSlickEvent implements SlickEvent {
  private _handlers = [];

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
  private _eventHandlers = [];

  notify(eventName: string, data?: any) {
    const pubSub = this._eventHandlers.find(subscription => subscription.name === eventName);
    if (typeof pubSub?.handler === 'function') {
      pubSub.handler(data);
    }
  }

  subscribe(event: MockSlickEvent, handler: (data: any, e?: any) => void): any {
    this._eventHandlers.push({
      event,
      handler
    });
    if (event.subscribe) {
      event.subscribe(handler);
    }

    return this;
  }

  unsubscribe(event: MockSlickEvent, handler: (data: any, e: any) => void) {
    let i = this._eventHandlers.length;
    while (i--) {
      if (this._eventHandlers[i].event === event &&
        this._eventHandlers[i].handler === handler) {
        this._eventHandlers.splice(i, 1);
        if (event.unsubscribe) {
          event.unsubscribe(handler);
        }
        break;
      }
    }

    return this;  // allow chaining
  }

  unsubscribeAll() {
    let i = this._eventHandlers.length;
    while (i--) {
      if (this._eventHandlers[i].event.unsubscribe) {
        this._eventHandlers[i].event.unsubscribe(this._eventHandlers[i].handler);
      }
    }
    this._eventHandlers = [];

    return this;  // allow chaining
  }
}
