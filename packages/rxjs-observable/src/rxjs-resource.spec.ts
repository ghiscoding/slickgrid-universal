import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY, isObservable, Observable, Subject, } from 'rxjs';

import { RxJsResource } from './rxjs.resource.js';

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
    const observable1 = service.createObservable();
    const observable2 = service.of(1, 2, 3);
    expect(observable1 instanceof Observable).toBeTruthy();
    expect(observable2 instanceof Observable).toBeTruthy();
    expect(service.isObservable(observable1)).toBeTruthy();
    expect(service.isObservable(observable2)).toBeTruthy();
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

  it('should be able to execute the "switchMap" method and expect an Observable returned', () => {
    const observable = service.createObservable();
    const output = observable.pipe(service.switchMap(() => service.createObservable()));
    expect(output instanceof Observable).toBeTruthy();
  });

  it('should be able to execute the "takeUntil" method and expect an Observable returned', () => {
    const observable = service.createObservable();
    const iifOutput = service.iif(() => isObservable(observable));
    const output = observable.pipe(service.takeUntil(iifOutput));
    expect(output instanceof Observable).toBeTruthy();
  });
});
