import { PubSubService } from '../pubSub.service';

describe('PubSub Service', () => {
  it('should display a not implemented when calling "publish" method', () => {
    expect(() => PubSubService.prototype.publish('event1')).toThrow('PubSubService "publish" method must be implemented');
  });

  it('should display a not implemented when calling "subscribe" method', () => {
    expect(() => PubSubService.prototype.subscribe('event1', () => { })).toThrow('PubSubService "subscribe" method must be implemented');
  });

  it('should display a not implemented when calling "subscribeEvent" method', () => {
    expect(() => PubSubService.prototype.subscribeEvent!('event1', () => { })).toThrow('PubSubService "subscribeEvent" method must be implemented');
  });

  it('should display a not implemented when calling "unsubscribe" method', () => {
    expect(() => PubSubService.prototype.unsubscribe('event1', () => { })).toThrow('PubSubService "unsubscribe" method must be implemented');
  });

  it('should display a not implemented when calling "unsubscribeAll" method', () => {
    expect(() => PubSubService.prototype.unsubscribeAll()).toThrow('PubSubService "unsubscribeAll" method must be implemented');
  });
});
