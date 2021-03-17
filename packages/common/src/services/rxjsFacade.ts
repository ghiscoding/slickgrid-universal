/* eslint-disable @typescript-eslint/no-unused-vars */

//
// -----------------------------------------------------------------------------
// THIS IS JUST AN EMPTY SHELL, A FACADE TO RxJs without making it a dependency
// -----------------------------------------------------------------------------

/**
 * A simple empty shell, a Facade to RxJS to make Slickgrid-Universal usable with RxJS without installing RxJS.
 * Its sole purpose is to provide access, as an Interface, to use RxJS with Slickgrid-Universal without adding it as a dependency.
 * The developer who will want to use RxJS will simply have to use the extra `rxjs-observable` package to get going.
 *
 * That external `rsjs-observable` package simply implements this RxJsFacade
 * and is just a very simple and basic RxJS Wrapper package (which will depend on the real RxJS package)
 */
export abstract class RxJsFacade {
  /**
   * The same Observable instance returned by any call to without a scheduler.
   * This returns the EMPTY constant from RxJS
   */
  get EMPTY(): ObservableFacade<never> {
    throw new Error('RxJS Facade "EMPTY" constant must be implemented');
  }

  /** Simple method to create an Observable */
  createObservable<T>(): ObservableFacade<T> {
    throw new Error('RxJS Facade "createObservable" method must be implemented');
  }

  /** Simple method to create a Subject */
  createSubject<T>(): SubjectFacade<T> {
    throw new Error('RxJS Facade "createSubject" method must be implemented');
  }

  first<T, D = T>(predicate?: null, defaultValue?: D): any {
    throw new Error('RxJS Facade "first" method must be implemented');
  }


  /** Decides at subscription time which Observable will actually be subscribed. */
  iif<T = never, F = never>(condition: () => boolean, trueResult?: any, falseResult?: any): ObservableFacade<T | F> {
    throw new Error('RxJS Facade "iif" method must be implemented');
  }

  /** Tests to see if the object is an RxJS Observable */
  isObservable<T>(obj: any): boolean {
    return false;
  }

  /** Emits the values emitted by the source Observable until a `notifier` Observable emits a value. */
  takeUntil<T>(notifier: ObservableFacade<any>): any {
    throw new Error('RxJS Facade "takeUntil" method must be implemented');
  }
}

/** A representation of any set of values over any amount of time. This is the most basic building block of RxJS. */
export abstract class ObservableFacade<T> {
  /** Observable constructor, you can provide a subscribe function that is called when the Observable is initially subscribed to. */
  constructor(subscribe?: (this: ObservableFacade<T>, subscriber: any) => any) {
    throw new Error('RxJS Observable Facade "constructor" method must be implemented');
  }

  /** Subscribe to the Observable */
  subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): SubscriptionFacade {
    throw new Error('RxJS Observable Facade "subscribe" method must be implemented');
  }

  /** Pipe an operator function to the Observable */
  pipe(fns?: any): any {
    throw new Error('RxJS Observable Facade "pipe" method must be implemented');
  }
}

/**
 * A Subject is a special type of Observable that allows values to be
 * multicasted to many Observers. Subjects are like EventEmitters.
 */
export abstract class SubjectFacade<T> extends ObservableFacade<T> {
  next(value?: T): void {
    throw new Error('RxJS Subject "next" method must be implemented');
  }

  unsubscribe(): void {
    throw new Error('RxJS Subject "unsubscribe" method must be implemented');
  }
}

/**
 * A Subject is a special type of Observable that allows values to be
 * multicasted to many Observers. Subjects are like EventEmitters.
 */
export abstract class SubscriptionFacade {
  /** A function describing how to perform the disposal of resources when the `unsubscribe` method is called. */
  constructor(unsubscribe?: () => void) {
    throw new Error('RxJS Subscription Facade "constructor" method must be implemented');
  }

  /** Disposes the resources held by the subscription. */
  unsubscribe(): void {
    throw new Error('RxJS Subscription Facade "unsubscribe" method must be implemented');
  }
}
