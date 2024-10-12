import { describe, expect, it } from 'vitest';

import { Observable, RxJsFacade, Subject, Subscription } from '../rxjsFacade.js';

describe('RxJsFacade Service', () => {
  it('should throw a not implemented error when calling "EMPTY" getter', () => {
    expect(() => RxJsFacade.prototype.EMPTY).toThrow('RxJS Facade "EMPTY" constant must be implemented');
  });

  it('should throw a not implemented error when calling "createObservable" method', () => {
    expect(() => RxJsFacade.prototype.createObservable()).toThrow('RxJS Facade "createObservable" method must be implemented');
  });

  it('should throw a not implemented error when calling "createSubject" method', () => {
    expect(() => RxJsFacade.prototype.createSubject()).toThrow('RxJS Facade "createSubject" method must be implemented');
  });

  it('should throw a not implemented error when calling "firstValueFrom" method', () => {
    expect(() => RxJsFacade.prototype.firstValueFrom({} as any)).toThrow('RxJS Facade "firstValueFrom" method must be implemented');
  });

  it('should throw a not implemented error when calling "iif" method', () => {
    expect(() => RxJsFacade.prototype.iif(() => false)).toThrow('RxJS Facade "iif" method must be implemented');
  });

  it('should always return False when calling "isObservable" method', () => {
    expect(RxJsFacade.prototype.isObservable({})).toBe(false);
  });


  it('should throw a not implemented error when calling "of" method', () => {
    expect(() => RxJsFacade.prototype.of({} as any)).toThrow('RxJS Facade "of" method must be implemented');
  });

  it('should throw a not implemented error when calling "switchMap" method', () => {
    expect(() => RxJsFacade.prototype.switchMap(() => false)).toThrow('RxJS Facade "switchMap" method must be implemented');
  });

  it('should throw a not implemented error when calling "takeUntil" method', () => {
    expect(() => RxJsFacade.prototype.takeUntil({} as any)).toThrow('RxJS Facade "takeUntil" method must be implemented');
  });
});

describe('Subject Service', () => {
  it('should throw a not implemented error when calling "complete" method', () => {
    expect(() => Subject.prototype.complete()).toThrow('RxJS Subject "complete" method must be implemented');
  });

  it('should throw a not implemented error when calling "next" method', () => {
    expect(() => Subject.prototype.next({} as any)).toThrow('RxJS Subject "next" method must be implemented');
  });

  it('should throw a not implemented error when calling "unsubscribe" method', () => {
    expect(() => Subject.prototype.unsubscribe()).toThrow('RxJS Subject "unsubscribe" method must be implemented');
  });
});

describe('Observable Service', () => {
  it('should throw a not implemented error when calling "constructor"', () => {
    // @ts-ignore
    expect(() => new Observable()).toThrow('RxJS Observable Facade "constructor" method must be implemented');
  });

  it('should throw a not implemented error when calling "subscribe" method', () => {
    expect(() => Observable.prototype.subscribe()).toThrow('RxJS Observable Facade "subscribe" method must be implemented');
  });

  it('should throw a not implemented error when calling "pipe" method', () => {
    expect(() => Observable.prototype.pipe({})).toThrow('RxJS Observable Facade "pipe" method must be implemented');
  });
});

describe('Subscription Service', () => {
  it('should throw a not implemented error when calling "next" method', () => {
    // @ts-ignore
    expect(() => new Subscription()).toThrow('RxJS Subscription Facade "constructor" method must be implemented');
  });

  it('should throw a not implemented error when calling "pipe" method', () => {
    expect(() => Subscription.prototype.unsubscribe()).toThrow('RxJS Subscription Facade "unsubscribe" method must be implemented');
  });
});
