import { EMPTY, isObservable, Observable, Subject } from 'rxjs';
import { RxJsResource } from './rxjs.resource';

describe('RxJs Resource', () => {
  let service: RxJsResource;

  beforeEach(() => {
    service = new RxJsResource();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
    expect(service.className).toBe('RxJsResource');
  });

  it('should be able to create an RxJS Observable', () => {
    const observable = service.createObservable();
    expect(observable instanceof Observable).toBeTruthy();
    expect(service.isObservable(observable)).toBeTruthy();
  });

  it('should be able to create an RxJS Subject', () => {
    const subject = service.createSubject();
    expect(subject instanceof Subject).toBeTruthy();
  });

  it('should be able to retrieve the RxJS EMPTY constant from the service getter', () => {
    expect(service.EMPTY).toEqual(EMPTY);
  });

  it('should be able to execute the "iif" method and expect an Observable returned', () => {
    const observable = service.createObservable();
    const iifOutput = service.iif(() => isObservable(observable));
    expect(iifOutput instanceof Observable).toBeTruthy();
  });

  it('should be able to execute the "firstValueFrom" method and expect an Observable returned', () => {
    const observable = service.createObservable();
    const output = service.firstValueFrom(observable);
    expect(output instanceof Promise).toBeTruthy();
  });

  it('should be able to execute the "takeUntil" method and expect an Observable returned', () => {
    const observable = service.createObservable();
    const iifOutput = service.iif(() => isObservable(observable));
    const output = observable.pipe(service.takeUntil(iifOutput));
    expect(output instanceof Observable).toBeTruthy();
  });
});
