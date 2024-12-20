import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventPubSubService } from './eventPubSub.service.js';
import { EventNamingStyle } from './types/eventNamingStyle.enum.js';

describe('EventPubSub Service', () => {
  let service: EventPubSubService;
  let divContainer: HTMLDivElement;

  beforeEach(() => {
    divContainer = document.createElement('div');
    service = new EventPubSubService(divContainer);
    service.eventNamingStyle = EventNamingStyle.camelCase;
  });

  afterEach(() => {
    service.unsubscribeAll();
    service?.dispose();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
    expect(service.elementSource).toBeTruthy();
  });

  it('should be able to change the service element source afterward', () => {
    const div = document.createElement('div');
    div.className = 'test';
    service.elementSource = div;

    expect(service.elementSource).toEqual(div);
  });

  describe('publish method', () => {
    afterEach(() => {
      service.unsubscribeAll();
    });

    it('should call publish method and expect "dispatchCustomEvent" and "getEventNameByNamingConvention" to be called', () => {
      const dispatchSpy = vi.spyOn(service, 'dispatchCustomEvent');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');

      const publishResult = service.publish('onClick', { name: 'John' });

      expect(publishResult).toBeTruthy();
      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(dispatchSpy).toHaveBeenCalledWith('onClick', { name: 'John' }, true, true, undefined);
    });

    it('should call publish method and expect it to return it a simple boolean (without delay argument provided)', () => {
      const dispatchSpy = vi.spyOn(service, 'dispatchCustomEvent');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');

      const publishResult = service.publish('onClick', { name: 'John' });

      expect(publishResult).toBeTruthy();
      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(dispatchSpy).toHaveBeenCalledWith('onClick', { name: 'John' }, true, true, undefined);
    });

    it('should call publish method and expect it to return it a boolean in a Promise when a delay is provided', async () => {
      const dispatchSpy = vi.spyOn(service, 'dispatchCustomEvent');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');

      const publishResult = await service.publish('onClick', { name: 'John' }, 1);

      expect(publishResult).toBeTruthy();
      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(dispatchSpy).toHaveBeenCalledWith('onClick', { name: 'John' }, true, true, undefined);
    });

    it('should define a different event name styling and expect "dispatchCustomEvent" and "getEventNameByNamingConvention" to be called', () => {
      const dispatchSpy = vi.spyOn(service, 'dispatchCustomEvent');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');

      service.eventNamingStyle = EventNamingStyle.lowerCase;
      const publishResult = service.publish('onClick', { name: 'John' });

      expect(publishResult).toBeTruthy();
      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(dispatchSpy).toHaveBeenCalledWith('onclick', { name: 'John' }, true, true, undefined);
    });

    it('should call publish method with an externalize event callback and expect it to receive the custom event used by the pubsub', () => {
      const dispatchSpy = vi.spyOn(service, 'dispatchCustomEvent');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');

      const obj: any = { nativeEvent: null };
      const publishResult = service.publish('onClick', { name: 'John' }, undefined, (evt) => (obj.nativeEvent = evt));

      expect(obj.nativeEvent).toBeInstanceOf(CustomEvent);
      expect(publishResult).toBeTruthy();
      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(dispatchSpy).toHaveBeenCalledWith('onClick', { name: 'John' }, true, true, expect.any(Function));
    });
  });

  describe('subscribe method', () => {
    afterEach(() => {
      service.unsubscribeAll();
    });

    it('should call subscribe method and expect "addEventListener" and "getEventNameByNamingConvention" to be called', () => {
      const addEventSpy = vi.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = vi.fn();

      service.subscribe('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(addEventSpy).toHaveBeenCalledWith('onClick', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });
    });

    it('should call subscribe method and expect "addEventListener" and "getEventNameByNamingConvention" to be called with kebabCase', () => {
      const addEventSpy = vi.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = vi.fn();

      service.eventNamingStyle = EventNamingStyle.kebabCase;
      service.subscribe('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('on-click', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['on-click']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(addEventSpy).toHaveBeenCalledWith('on-click', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });
    });
  });

  describe('subscribeEvent method', () => {
    afterEach(() => {
      service.unsubscribeAll();
    });

    it('should call subscribe method and expect "addEventListener" and "getEventNameByNamingConvention" to be called', () => {
      const addEventSpy = vi.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = vi.fn();

      service.eventNamingStyle = EventNamingStyle.lowerCaseWithoutOnPrefix;
      service.subscribeEvent('click', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('click', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('click', '');
      expect(service.subscribedEventNames).toEqual(['click']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(addEventSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledTimes(1);
      // expect(mockCallback).toHaveBeenCalledWith({ detail: { name: 'John' } });
    });

    it('should call subscribe method and expect "addEventListener" and "getEventNameByNamingConvention" to be called with kebabCase', () => {
      const addEventSpy = vi.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = vi.fn();

      service.eventNamingStyle = EventNamingStyle.kebabCase;
      const subscription = service.subscribeEvent('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('on-click', { composed: true, detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['on-click']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(addEventSpy).toHaveBeenCalledWith('on-click', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledTimes(1);
      // expect(mockCallback).toHaveBeenCalledWith({ detail: { name: 'John' } });

      subscription.unsubscribe();
      expect(service.subscribedEvents.length).toBe(0);
    });

    it('should call subscribe method and expect "addEventListener" and "getEventNameByNamingConvention" to be called with camelCaseWithExtraOnPrefix', () => {
      const addEventSpy = vi.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = vi.fn();

      service.eventNamingStyle = EventNamingStyle.camelCaseWithExtraOnPrefix;
      const subscription = service.subscribeEvent('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('onOnClick', { composed: true, detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['onOnClick']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(addEventSpy).toHaveBeenCalledWith('onOnClick', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledTimes(1);
      // expect(mockCallback).toHaveBeenCalledWith({ detail: { name: 'John' } });

      subscription.unsubscribe();
      expect(service.subscribedEvents.length).toBe(0);
    });
  });

  describe('unsubscribe & unsubscribeAll method', () => {
    it('should unsubscribe an event with a listener', () => {
      const removeEventSpy = vi.spyOn(divContainer, 'removeEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = vi.fn();

      service.subscribe('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });

      service.unsubscribe('onClick', mockCallback);
      expect(removeEventSpy).toHaveBeenCalledWith('onClick', mockCallback);
      expect(service.subscribedEvents.length).toBe(0);
    });

    it('should be able to unsubscribe directly from the subscription', () => {
      const removeEventSpy = vi.spyOn(divContainer, 'removeEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = vi.fn();

      const subscription = service.subscribe('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });

      subscription.unsubscribe();
      expect(removeEventSpy).toHaveBeenCalledWith('onClick', mockCallback);
      expect(service.subscribedEvents.length).toBe(0);
    });

    it('should be able to provide an array of event to subscribe and be able to unsubscribeAll events', () => {
      const removeEventSpy = vi.spyOn(divContainer, 'removeEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const unsubscribeSpy = vi.spyOn(service, 'unsubscribe');
      const mockCallback = vi.fn();

      service.subscribe(['onClick', 'onDblClick'], mockCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(getEventNameSpy).toHaveBeenCalledWith('onDblClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick', 'onDblClick']);
      expect(service.subscribedEvents.length).toBe(2);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });

      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));
      divContainer.dispatchEvent(new CustomEvent('onDblClick', { detail: { name: 'Jane' } }));

      expect(mockCallback).toHaveBeenCalledTimes(3);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });
      expect(mockCallback).toHaveBeenCalledWith({ name: 'Jane' });

      service.unsubscribeAll();
      expect(removeEventSpy).toHaveBeenCalledWith('onClick', mockCallback);
      expect(removeEventSpy).toHaveBeenCalledWith('onDblClick', mockCallback);
      expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
      expect(service.subscribedEvents.length).toBe(0);
    });

    it('should be able to subscribe to multiple event and be able to unsubscribeAll events', () => {
      const removeEventSpy = vi.spyOn(divContainer, 'removeEventListener');
      const getEventNameSpy = vi.spyOn(service, 'getEventNameByNamingConvention');
      const unsubscribeSpy = vi.spyOn(service, 'unsubscribe');
      const mockCallback = vi.fn();
      const mockDblCallback = vi.fn();

      service.subscribe('onClick', mockCallback);
      service.subscribe('onDblClick', mockDblCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(getEventNameSpy).toHaveBeenCalledWith('onDblClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick', 'onDblClick']);
      expect(service.subscribedEvents.length).toBe(2);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });

      divContainer.dispatchEvent(new CustomEvent('onDblClick', { detail: { name: 'Jane' } }));

      expect(mockDblCallback).toHaveBeenCalledTimes(1);
      expect(mockDblCallback).toHaveBeenCalledWith({ name: 'Jane' });

      service.unsubscribeAll();
      expect(removeEventSpy).toHaveBeenCalledWith('onClick', mockCallback);
      expect(removeEventSpy).toHaveBeenCalledWith('onDblClick', mockDblCallback);
      expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
      expect(service.subscribedEvents.length).toBe(0);
    });

    it('should unsubscribe all PubSub by disposing all of them', () => {
      const mockDispose1 = vi.fn();
      const mockDispose2 = vi.fn();
      const mockSubscription1 = { dispose: mockDispose1 };
      const mockSubscription2 = { dispose: mockDispose2 };
      const mockSubscriptions = [mockSubscription1, mockSubscription2];

      service.unsubscribeAll(mockSubscriptions);

      expect(mockDispose1).toHaveBeenCalledTimes(1);
      expect(mockDispose2).toHaveBeenCalledTimes(1);
      expect(service.subscribedEvents.length).toBe(0);
    });

    it('should unsubscribe all PubSub by unsubscribing all of them', () => {
      const mockUnsubscribe1 = vi.fn();
      const mockUnsubscribe2 = vi.fn();
      const mockSubscription1 = { unsubscribe: mockUnsubscribe1 };
      const mockSubscription2 = { unsubscribe: mockUnsubscribe2 };
      const mockSubscriptions = [mockSubscription1, mockSubscription2];

      service.unsubscribeAll(mockSubscriptions);

      expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
      expect(service.subscribedEvents.length).toBe(0);
    });
  });
});
