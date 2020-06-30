import { EventPubSubService } from '../eventPubSub.service';
import { EventNamingStyle } from '@slickgrid-universal/common';

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
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('publish method', () => {
    afterEach(() => {
      service.unsubscribeAll();
    });

    it('should call publish method and expect "dispatchCustomEvent" and "getEventNameByNamingConvention" to be called', () => {
      const dispatchSpy = jest.spyOn(service, 'dispatchCustomEvent');
      const getEventNameSpy = jest.spyOn(service, 'getEventNameByNamingConvention');

      service.publish('onClick', { name: 'John' });

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(dispatchSpy).toHaveBeenCalledWith('onClick', { name: 'John' }, true, false);
    });

    it('should define a different event name styling and expect "dispatchCustomEvent" and "getEventNameByNamingConvention" to be called', () => {
      const dispatchSpy = jest.spyOn(service, 'dispatchCustomEvent');
      const getEventNameSpy = jest.spyOn(service, 'getEventNameByNamingConvention');

      service.eventNamingStyle = EventNamingStyle.lowerCase;
      service.publish('onClick', { name: 'John' });

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(dispatchSpy).toHaveBeenCalledWith('onclick', { name: 'John' }, true, false);
    });
  });

  describe('subscribe method', () => {
    afterEach(() => {
      service.unsubscribeAll();
    });

    it('should call subscribe method and expect "addEventListener" and "getEventNameByNamingConvention" to be called', () => {
      const addEventSpy = jest.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = jest.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = jest.fn();

      service.subscribe('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(addEventSpy).toHaveBeenCalledWith('onClick', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });
    });

    it('should call subscribe method and expect "addEventListener" and "getEventNameByNamingConvention" to be called', () => {
      const addEventSpy = jest.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = jest.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = jest.fn();

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
      const addEventSpy = jest.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = jest.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = jest.fn();

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

    it('should call subscribe method and expect "addEventListener" and "getEventNameByNamingConvention" to be called', () => {
      const addEventSpy = jest.spyOn(divContainer, 'addEventListener');
      const getEventNameSpy = jest.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = jest.fn();

      service.eventNamingStyle = EventNamingStyle.kebabCase;
      service.subscribeEvent('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('on-click', { composed: true, detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['on-click']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(addEventSpy).toHaveBeenCalledWith('on-click', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledTimes(1);
      // expect(mockCallback).toHaveBeenCalledWith({ detail: { name: 'John' } });
    });
  });

  describe('unsubscribe & unsubscribeAll method', () => {
    it('should unsubscribe an event with a listener', () => {
      const removeEventSpy = jest.spyOn(divContainer, 'removeEventListener');
      const getEventNameSpy = jest.spyOn(service, 'getEventNameByNamingConvention');
      const mockCallback = jest.fn();

      service.subscribe('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));
      service.unsubscribe('onClick', mockCallback);

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick']);
      expect(service.subscribedEvents.length).toBe(1);
      expect(removeEventSpy).toHaveBeenCalledWith('onClick', mockCallback);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });
    });

    it('should unsubscribeAll events', () => {
      const removeEventSpy = jest.spyOn(divContainer, 'removeEventListener');
      const getEventNameSpy = jest.spyOn(service, 'getEventNameByNamingConvention');
      const unsubscribeSpy = jest.spyOn(service, 'unsubscribe');
      const mockCallback = jest.fn();
      const mockDblCallback = jest.fn();

      service.subscribe('onClick', mockCallback);
      service.subscribe('onDblClick', mockDblCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));
      service.unsubscribeAll();

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(getEventNameSpy).toHaveBeenCalledWith('onDblClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick', 'onDblClick']);
      expect(service.subscribedEvents.length).toBe(2);
      expect(removeEventSpy).toHaveBeenCalledWith('onClick', mockCallback);
      expect(removeEventSpy).toHaveBeenCalledWith('onDblClick', mockDblCallback);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith({ name: 'John' });
    });

    it('should unsubscribe all PubSub by disposing all of them', () => {
      const mockDispose1 = jest.fn();
      const mockDispose2 = jest.fn();
      const mockSubscription1 = { dispose: mockDispose1 };
      const mockSubscription2 = { dispose: mockDispose2 };
      const mockSubscriptions = [mockSubscription1, mockSubscription2];

      service.unsubscribeAll(mockSubscriptions);

      expect(mockDispose1).toHaveBeenCalledTimes(1);
      expect(mockDispose2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe all PubSub by unsubscribing all of them', () => {
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();
      const mockSubscription1 = { unsubscribe: mockUnsubscribe1 };
      const mockSubscription2 = { unsubscribe: mockUnsubscribe2 };
      const mockSubscriptions = [mockSubscription1, mockSubscription2];

      service.unsubscribeAll(mockSubscriptions);

      expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    });
  });
});
