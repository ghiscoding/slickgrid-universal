import { ObservableFacade, RxJsFacade, SubjectFacade, SubscriptionFacade } from '../rxjsFacade';

describe('RxJsFacade Service', () => {
  it('should display a not implemented when calling "EMPTY" getter', () => {
    expect(() => RxJsFacade.prototype.EMPTY).toThrow('RxJS Facade "EMPTY" constant must be implemented');
  });

  it('should display a not implemented when calling "createObservable" method', () => {
    expect(() => RxJsFacade.prototype.createObservable()).toThrow('RxJS Facade "createObservable" method must be implemented');
  });

  it('should display a not implemented when calling "createSubject" method', () => {
    expect(() => RxJsFacade.prototype.createSubject()).toThrow('RxJS Facade "createSubject" method must be implemented');
  });

  it('should display a not implemented when calling "iif" method', () => {
    expect(() => RxJsFacade.prototype.iif(() => false)).toThrow('RxJS Facade "iif" method must be implemented');
  });

  it('should always return False when calling "isObservable" method', () => {
    expect(RxJsFacade.prototype.isObservable({})).toBe(false);
  });

  it('should display a not implemented when calling "takeUntil" method', () => {
    expect(() => RxJsFacade.prototype.takeUntil({} as any)).toThrow('RxJS Facade "takeUntil" method must be implemented');
  });
});

describe('SubjectFacade Service', () => {
  it('should display a not implemented when calling "next" method', () => {
    expect(() => SubjectFacade.prototype.next()).toThrow('RxJS Subject "next" method must be implemented');
  });

  it('should display a not implemented when calling "unsubscribe" method', () => {
    expect(() => SubjectFacade.prototype.unsubscribe()).toThrow('RxJS Subject "unsubscribe" method must be implemented');
  });
});

describe('ObservableFacade Service', () => {
  it('should display a not implemented when calling "constructor"', () => {
    // @ts-ignore
    expect(() => new ObservableFacade()).toThrow('RxJS Observable Facade "constructor" method must be implemented');
  });

  it('should display a not implemented when calling "subscribe" method', () => {
    expect(() => ObservableFacade.prototype.subscribe()).toThrow('RxJS Observable Facade "subscribe" method must be implemented');
  });

  it('should display a not implemented when calling "pipe" method', () => {
    expect(() => ObservableFacade.prototype.pipe({})).toThrow('RxJS Observable Facade "pipe" method must be implemented');
  });
});

describe('SubscriptionFacade Service', () => {
  it('should display a not implemented when calling "next" method', () => {
    // @ts-ignore
    expect(() => new SubscriptionFacade()).toThrow('RxJS Subscription Facade "constructor" method must be implemented');
  });

  it('should display a not implemented when calling "pipe" method', () => {
    expect(() => SubscriptionFacade.prototype.unsubscribe()).toThrow('RxJS Subscription Facade "unsubscribe" method must be implemented');
  });
});
