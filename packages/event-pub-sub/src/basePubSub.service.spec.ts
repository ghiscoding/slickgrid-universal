import { BasePubSubService } from './basePubSub.service';

describe('PubSub Service', () => {
  it('should display a not implemented when calling "publish" method', () => {
    expect(() => BasePubSubService.prototype.publish('event1')).toThrow('BasePubSubService "publish" method must be implemented');
  });

  it('should display a not implemented when calling "subscribe" method', () => {
    expect(() => BasePubSubService.prototype.subscribe('event1', () => { })).toThrow('BasePubSubService "subscribe" method must be implemented');
  });

  it('should display a not implemented when calling "subscribeEvent" method', () => {
    expect(() => BasePubSubService.prototype.subscribeEvent!('event1', () => { })).toThrow('BasePubSubService "subscribeEvent" method must be implemented');
  });

  it('should display a not implemented when calling "unsubscribe" method', () => {
    expect(() => BasePubSubService.prototype.unsubscribe('event1', () => { })).toThrow('BasePubSubService "unsubscribe" method must be implemented');
  });

  it('should display a not implemented when calling "unsubscribeAll" method', () => {
    expect(() => BasePubSubService.prototype.unsubscribeAll()).toThrow('BasePubSubService "unsubscribeAll" method must be implemented');
  });
});
