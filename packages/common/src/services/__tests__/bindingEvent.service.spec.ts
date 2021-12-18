import { BindingEventService } from '../bindingEvent.service';

describe('BindingEvent Service', () => {
  let div: HTMLDivElement;
  let service: BindingEventService;

  beforeEach(() => {
    service = new BindingEventService();
    div = document.createElement('div');
    document.body.appendChild(div);
  });

  afterEach(() => {
    div.remove();
    service.unbindAll();
    jest.clearAllMocks();
  });

  it('should be able to bind an event with listener to an element', () => {
    const mockElm = { addEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback = jest.fn();
    const addEventSpy = jest.spyOn(mockElm, 'addEventListener');
    const elm = document.createElement('input');
    div.appendChild(elm);

    service.bind(mockElm, 'click', mockCallback);

    expect(service.boundedEvents.length).toBe(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, undefined);
  });

  it('should be able to bind an event with listener and options to an element', () => {
    const mockElm = { addEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback = jest.fn();
    const addEventSpy = jest.spyOn(mockElm, 'addEventListener');
    const elm = document.createElement('input');
    div.appendChild(elm);

    service.bind(mockElm, 'click', mockCallback, { capture: true, passive: true });

    expect(service.boundedEvents.length).toBe(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
  });

  it('should be able to bind an event with single listener and options to multiple elements', () => {
    const mockElm = { addEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback = jest.fn();
    const elm1 = document.createElement('input');
    const elm2 = document.createElement('input');
    elm1.className = 'custom-class';
    elm2.className = 'custom-class';
    div.appendChild(elm1);
    div.appendChild(elm2);

    const btns = div.querySelectorAll('.custom-class');
    const addEventSpy1 = jest.spyOn(btns[0], 'addEventListener');
    const addEventSpy2 = jest.spyOn(btns[1], 'addEventListener');
    service.bind(btns, 'click', mockCallback, { capture: true, passive: true });

    expect(service.boundedEvents.length).toBe(2);
    expect(addEventSpy1).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
    expect(addEventSpy2).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
  });

  it('should call unbindAll and expect as many removeEventListener be called', () => {
    const mockElm = { addEventListener: jest.fn(), removeEventListener: jest.fn() } as unknown as HTMLElement;
    const addEventSpy = jest.spyOn(mockElm, 'addEventListener');
    const removeEventSpy = jest.spyOn(mockElm, 'removeEventListener');
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    service = new BindingEventService();
    service.bind(mockElm, 'keyup', mockCallback1);
    service.bind(mockElm, 'click', mockCallback2, { capture: true, passive: true });
    expect(service.boundedEvents.length).toBe(2);

    service.unbindAll();

    expect(service.boundedEvents.length).toBe(0);
    expect(addEventSpy).toHaveBeenCalledWith('keyup', mockCallback1, undefined);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback2, { capture: true, passive: true });
    expect(removeEventSpy).toHaveBeenCalledWith('keyup', mockCallback1);
    expect(removeEventSpy).toHaveBeenCalledWith('click', mockCallback2);
  });
});
