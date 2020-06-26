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

      service.subscribeEvent('onClick', mockCallback);
      divContainer.dispatchEvent(new CustomEvent('onClick', { detail: { name: 'John' } }));

      expect(getEventNameSpy).toHaveBeenCalledWith('onClick', '');
      expect(service.subscribedEventNames).toEqual(['onClick']);
      expect(addEventSpy).toHaveBeenCalledWith('onClick', expect.any(Function));
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
      expect(addEventSpy).toHaveBeenCalledWith('on-click', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledTimes(1);
      // expect(mockCallback).toHaveBeenCalledWith({ detail: { name: 'John' } });
    });
  });

});
