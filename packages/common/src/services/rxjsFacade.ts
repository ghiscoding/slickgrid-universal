/* eslint-disable @typescript-eslint/no-unused-vars */

//
// ------------------------------------------------
// THIS IS JUST AN EMPTY SHELL, A FACADE TO RxJs
// We only provide interfaces to be re-implemented via an external package with the real RxJS
// The reason we do this is to avoid adding RxJS as a dependency to the common package
// while also making it extensible to be used from outside.
// When user whishes to use RxJS Observables, he'll simply have to use the external
// RxJS Wrapper package (which will depend on the real RxJS package)
// -------------------------------------------------------------------------------------------------------

export const EMPTY: any = null;

export function iif<T = never, F = never>(condition: () => boolean, trueResult?: any, falseResult?: any): ObservableFacade<T | F> {
  throw new Error('RxJs Service "iif" method must be implemented');
}

/** Tests to see if the object is an RxJS Observable */
export function isObservable<T>(obj: any): boolean {
  throw new Error('RxJs Service "isObservable" method must be implemented');
}

export function takeUntil<T>(notifier: ObservableFacade<any>): any {
  throw new Error('RxJs Service "takeUntil" method must be implemented');
}

/**
 * A Subject is a special type of Observable that allows values to be
 * multicasted to many Observers. Subjects are like EventEmitters.
 */
export class SubjectFacade<T> {
  next(value?: T): void {
    throw new Error('RxJs Subject "next" method must be implemented');
  }
  error(err: any): void {
    throw new Error('RxJs Subject "error" method must be implemented');
  }
  complete(): void {
    throw new Error('RxJs Subject "complete" method must be implemented');
  }
  unsubscribe(): void {
    throw new Error('RxJs Subject "unsubscribe" method must be implemented');
  }

  /** Creates a new Observable with this Subject as the source. */
  asObservable(): ObservableFacade<T> {
    throw new Error('RxJs Subject "asObservable" method must be implemented');
  }
}

export class ObservableFacade<T> {
  /** Observable constructor, you can provide a subscribe function that is called when the Observable is initially subscribed to. */
  constructor(subscribe?: (this: ObservableFacade<T>, subscriber: any) => any) {
    throw new Error('RxJS Observable "constructor" method must be implemented');
  }

  /** Subscribe to the Observable */
  subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): SubscriptionFacade {
    throw new Error('RxJS Observable "subscribe" method must be implemented');
  }

  /** Pipe an operator function to the Observable */
  pipe(fns?: any): any {
    throw new Error('RxJS Observable "pipe" method must be implemented');
  }
}

export class SubscriptionFacade {
  /** A function describing how to perform the disposal of resources when the `unsubscribe` method is called. */
  constructor(unsubscribe?: () => void) {
    throw new Error('RxJS Subscription "constructor" method must be implemented');
  }

  /** Disposes the resources held by the subscription. */
  unsubscribe(): void {
    throw new Error('RxJS Subscription "unsubscribe" method must be implemented');
  }

  /** Adds a tear down to be called during the unsubscribe() of this Subscription. */
  add(teardown: any): SubscriptionFacade {
    throw new Error('RxJS Subscription "add" method must be implemented');
  }

  /** Removes a Subscription from the internal list of subscriptions that will unsubscribe during the unsubscribe process of this Subscription. */
  remove(subscription: SubscriptionFacade): void {
    throw new Error('RxJS Subscription "remove" method must be implemented');
  }
}
