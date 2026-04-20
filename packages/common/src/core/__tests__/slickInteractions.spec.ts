import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Draggable, MouseWheel, Resizable } from '../slickInteractions.js';

describe('Draggable class', () => {
  let containerElement: HTMLDivElement;
  let dg: any;

  beforeEach(() => {
    vi.resetAllMocks();
    containerElement = document.createElement('div');
  });

  afterEach(() => {
    containerElement?.remove();
    dg?.destroy();
  });

  it('should be able to instantiate the class', () => {
    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell' });

    expect(dg).toBeTruthy();
  });

  it('should be able to instantiate the class even without a valid containerElement', () => {
    dg = Draggable({ allowDragFrom: 'div.slick-cell' });

    expect(dg).toBeTruthy();
  });

  it('should trigger mousedown but NOT expect a dragInit to happen since it was not triggered by an allowed element', () => {
    const dragInitSpy = vi.fn();

    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell', onDrag: dragInitSpy });

    containerElement.dispatchEvent(new MouseEvent('mousedown'));

    expect(dg).toBeTruthy();
    expect(dragInitSpy).not.toHaveBeenCalled();
  });

  it('should trigger mousedown and expect a dragInit to happen since it was triggered by an allowed element but NOT expect a drag to actually happen since we did not move afterward', () => {
    const dragInitSpy = vi.fn();
    const dragSpy = vi.fn();
    containerElement.className = 'slick-cell';

    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell', onDrag: dragSpy, onDragInit: dragInitSpy });

    containerElement.dispatchEvent(new MouseEvent('mousedown'));

    expect(dg).toBeTruthy();
    expect(dragInitSpy).toHaveBeenCalled();
    expect(dragSpy).not.toHaveBeenCalled();

    dg.destroy();
  });

  it('should NOT trigger dragInit event when user is pressing mousedown and mousemove + Ctrl key combo that we considered as forbidden via "preventDragFromKeys"', () => {
    const dragInitSpy = vi.fn();
    const dragSpy = vi.fn();
    containerElement.className = 'slick-cell';

    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell', preventDragFromKeys: ['ctrlKey'], onDrag: dragSpy, onDragInit: dragInitSpy });

    containerElement.dispatchEvent(new MouseEvent('mousedown', { ctrlKey: true }));

    expect(dg).toBeTruthy();
    expect(dragInitSpy).not.toHaveBeenCalled();
    expect(dragSpy).not.toHaveBeenCalled();

    dg.destroy();
  });

  it('should trigger mousedown and expect a dragInit and a dragStart and drag to all happen since it was triggered by an allowed element and we did move afterward', () => {
    const removeBodyListenerSpy = vi.spyOn(document.body, 'removeEventListener');
    const removeWindowListenerSpy = vi.spyOn(window, 'removeEventListener');
    const dragInitSpy = vi.fn();
    const dragSpy = vi.fn();
    const dragStartSpy = vi.fn();
    const dragEndSpy = vi.fn();
    containerElement.className = 'slick-cell';

    dg = Draggable({
      containerElement,
      allowDragFrom: 'div.slick-cell',
      dragFromClassDetectArr: [{ cssSelector: '.slick-cell', tag: '.slick-cell' }],
      onDrag: dragSpy,
      onDragInit: dragInitSpy,
      onDragStart: dragStartSpy,
      onDragEnd: dragEndSpy,
    });

    const mdEvt = new MouseEvent('mousedown');
    Object.defineProperty(mdEvt, 'clientX', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(mdEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    containerElement.dispatchEvent(mdEvt);

    const mmEvt = new MouseEvent('mousemove');
    const muEvt = new MouseEvent('mouseup');
    Object.defineProperty(mmEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(mmEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(muEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(muEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    document.body.dispatchEvent(mmEvt);
    window.dispatchEvent(muEvt);

    expect(dg).toBeTruthy();
    expect(dragInitSpy).toHaveBeenCalledWith(mdEvt, {
      startX: 10,
      startY: 10,
      deltaX: 2,
      deltaY: 0,
      dragHandle: containerElement,
      dragSource: containerElement,
      matchClassTag: '.slick-cell',
      target: window,
    });
    expect(dragStartSpy).toHaveBeenCalled(); // TODO: revisit calledWith X/Y pos, after migrating to TS class
    expect(dragSpy).toHaveBeenCalled();
    expect(dragEndSpy).toHaveBeenCalled();
    expect(removeBodyListenerSpy).toHaveBeenCalledTimes(2 * 2); // 2x events
    expect(removeWindowListenerSpy).toHaveBeenCalledTimes(3 * 2); // 3x events
  });

  it('should NOT trigger dragInit,dragStart events when user is pressing mousedown and mousemove + Meta key combo that we considered as forbidden via "preventDragFromKeys"', async () => {
    const bodyRemoveListenerSpy = vi.spyOn(document.body, 'removeEventListener');
    const dragInitSpy = vi.fn();
    const dragSpy = vi.fn();
    const dragStartSpy = vi.fn();
    const dragEndSpy = vi.fn();
    containerElement.className = 'slick-cell';

    dg = Draggable({
      containerElement,
      allowDragFrom: 'div.slick-cell',
      preventDragFromKeys: ['metaKey'],
      onDrag: dragSpy,
      onDragInit: dragInitSpy,
      onDragStart: dragStartSpy,
      onDragEnd: dragEndSpy,
    });

    const mdEvt = new MouseEvent('mousedown', { metaKey: true });
    Object.defineProperty(mdEvt, 'clientX', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(mdEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    containerElement.dispatchEvent(mdEvt);

    const mmEvt = new MouseEvent('mousemove', { metaKey: true });
    const muEvt = new MouseEvent('mouseup', { metaKey: true });
    Object.defineProperty(mmEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(mmEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(muEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(muEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    document.body.dispatchEvent(mmEvt);
    window.dispatchEvent(muEvt);

    expect(dg).toBeTruthy();
    expect(dragInitSpy).not.toHaveBeenCalledWith(mdEvt, {
      startX: 10,
      startY: 10,
      deltaX: 2,
      deltaY: 0,
      dragHandle: containerElement,
      dragSource: containerElement,
      target: document.body,
    });
    expect(dragStartSpy).not.toHaveBeenCalled();
    expect(dragSpy).not.toHaveBeenCalled();
    expect(dragEndSpy).not.toHaveBeenCalled();
    expect(bodyRemoveListenerSpy).not.toHaveBeenCalled();
  });
});

describe('MouseWheel class', () => {
  let mw: any;

  afterEach(() => {
    mw?.destroy();
  });

  it('should be able to instantiate the class', () => {
    mw = MouseWheel({ element: document.createElement('div') });

    expect(mw).toBeTruthy();
  });

  it('should trigger mouse wheel event and expect onMouseWheel handler to be called old school way with regular mouse and WebKit browser event', () => {
    const wheelSpy = vi.fn();

    const element = document.createElement('div');
    mw = MouseWheel({ element, onMouseWheel: wheelSpy });

    const mdEvt = new Event('wheel');
    Object.defineProperty(mdEvt, 'wheelDelta', { writable: true, configurable: true, value: -120 });
    Object.defineProperty(mdEvt, 'wheelDeltaX', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(mdEvt, 'wheelDeltaY', { writable: true, configurable: true, value: -120 });
    element.dispatchEvent(mdEvt);

    expect(mw).toBeTruthy();
    expect(wheelSpy).toHaveBeenCalledWith(mdEvt, -1, -0, -1);
  });

  it('should trigger mouse wheel event and expect onMouseWheel handler to be called new school way with touchpad multidimensional scroll', () => {
    const wheelSpy = vi.fn();

    const element = document.createElement('div');
    mw = MouseWheel({ element, onMouseWheel: wheelSpy });

    const mdEvt = new Event('wheel');
    Object.defineProperty(mdEvt, 'detail', { writable: true, configurable: true, value: 3 });
    Object.defineProperty(mdEvt, 'wheelDeltaX', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(mdEvt, 'wheelDeltaY', { writable: true, configurable: true, value: -120 });
    element.dispatchEvent(mdEvt);

    expect(mw).toBeTruthy();
    expect(wheelSpy).toHaveBeenCalledWith(mdEvt, -1, -0, -1);
  });

  it('should trigger mouse wheel event and expect onMouseWheel handler to be called old school way with regular mouse and Gecko browser event', () => {
    const wheelSpy = vi.fn();

    const element = document.createElement('div');
    mw = MouseWheel({ element, onMouseWheel: wheelSpy });

    const mdEvt = new Event('wheel');
    Object.defineProperty(mdEvt, 'wheelDelta', { writable: true, configurable: true, value: -120 });
    Object.defineProperty(mdEvt, 'axis', { writable: true, configurable: true, value: 3 });
    Object.defineProperty(mdEvt, 'HORIZONTAL_AXIS', { writable: true, configurable: true, value: 3 });
    element.dispatchEvent(mdEvt);

    expect(mw).toBeTruthy();
    expect(wheelSpy).toHaveBeenCalledWith(mdEvt, -1, 1, 0);
  });
});

describe('Resizable class', () => {
  let rsz: any;
  let containerElement: HTMLDivElement;
  let previousPointerEvent: typeof window.PointerEvent | undefined;

  beforeEach(() => {
    previousPointerEvent = (window as any).PointerEvent;
    containerElement = document.createElement('div');
    containerElement.className = 'slick-container';
  });

  afterEach(() => {
    rsz?.destroy();
    if (previousPointerEvent) {
      (window as any).PointerEvent = previousPointerEvent;
    } else {
      delete (window as any).PointerEvent;
    }
  });

  it('should be able to instantiate the class', () => {
    rsz = Resizable({
      resizeableElement: document.createElement('div'),
      resizeableHandleElement: document.createElement('div'),
    });

    expect(rsz).toBeTruthy();
  });

  it('should throw when instantiating without a valid handle resizeable element', () => {
    expect(() => Resizable({} as any)).toThrow('[SlickResizable] You did not provide a valid html element that will be used for the handle to resize.');
  });

  it('should trigger resize callbacks on start, move and end interactions', () => {
    const resizeSpy = vi.fn();
    const resizeStartSpy = vi.fn();
    const resizeEndSpy = vi.fn();
    containerElement.className = 'slick-cell';

    rsz = Resizable({
      resizeableElement: containerElement,
      resizeableHandleElement: containerElement,
      onResize: resizeSpy,
      onResizeStart: resizeStartSpy,
      onResizeEnd: resizeEndSpy,
    });

    const hasPointerEvents = typeof window !== 'undefined' && 'PointerEvent' in window;

    if (hasPointerEvents) {
      const pointerDownEvt = new Event('pointerdown');
      Object.defineProperty(pointerDownEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
      Object.defineProperty(pointerDownEvt, 'button', { writable: true, configurable: true, value: 0 });
      Object.defineProperty(pointerDownEvt, 'pointerId', { writable: true, configurable: true, value: 1 });

      const pointerMoveEvt = new Event('pointermove');
      Object.defineProperty(pointerMoveEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
      Object.defineProperty(pointerMoveEvt, 'pointerId', { writable: true, configurable: true, value: 1 });

      const pointerUpEvt = new Event('pointerup');
      Object.defineProperty(pointerUpEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
      Object.defineProperty(pointerUpEvt, 'pointerId', { writable: true, configurable: true, value: 1 });

      containerElement.dispatchEvent(pointerDownEvt);
      containerElement.dispatchEvent(pointerMoveEvt);
      containerElement.dispatchEvent(pointerUpEvt);
    } else {
      const mdEvt = new MouseEvent('mousedown');
      Object.defineProperty(mdEvt, 'clientX', { writable: true, configurable: true, value: 10 });
      Object.defineProperty(mdEvt, 'clientY', { writable: true, configurable: true, value: 10 });
      containerElement.dispatchEvent(mdEvt);

      const mmEvt = new MouseEvent('mousemove');
      const muEvt = new MouseEvent('mouseup');
      Object.defineProperty(mmEvt, 'clientX', { writable: true, configurable: true, value: 12 });
      Object.defineProperty(mmEvt, 'clientY', { writable: true, configurable: true, value: 10 });
      Object.defineProperty(muEvt, 'clientX', { writable: true, configurable: true, value: 12 });
      Object.defineProperty(muEvt, 'clientY', { writable: true, configurable: true, value: 10 });
      document.body.dispatchEvent(mmEvt);
      document.body.dispatchEvent(muEvt);
    }

    expect(rsz).toBeTruthy();
    expect(resizeStartSpy).toHaveBeenCalledTimes(1);
    expect(resizeSpy).toHaveBeenCalled();
    expect(resizeEndSpy).toHaveBeenCalled();
  });

  it('should use pointer events and call resize callbacks with pointer capture', () => {
    const resizeSpy = vi.fn();
    const resizeStartSpy = vi.fn();
    const resizeEndSpy = vi.fn();
    const setPointerCaptureSpy = vi.fn();
    const releasePointerCaptureSpy = vi.fn();
    const hasPointerCaptureSpy = vi.fn().mockReturnValue(true);

    (window as any).PointerEvent = class PointerEventMock extends Event {};
    (containerElement as any).setPointerCapture = setPointerCaptureSpy;
    (containerElement as any).releasePointerCapture = releasePointerCaptureSpy;
    (containerElement as any).hasPointerCapture = hasPointerCaptureSpy;

    rsz = Resizable({
      resizeableElement: containerElement,
      resizeableHandleElement: containerElement,
      onResize: resizeSpy,
      onResizeStart: resizeStartSpy,
      onResizeEnd: resizeEndSpy,
    });

    const pointerDownEvt = new Event('pointerdown');
    Object.defineProperty(pointerDownEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(pointerDownEvt, 'button', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(pointerDownEvt, 'pointerId', { writable: true, configurable: true, value: 1 });

    const pointerMoveEvt = new Event('pointermove');
    Object.defineProperty(pointerMoveEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(pointerMoveEvt, 'pointerId', { writable: true, configurable: true, value: 1 });

    const pointerUpEvt = new Event('pointerup');
    Object.defineProperty(pointerUpEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(pointerUpEvt, 'pointerId', { writable: true, configurable: true, value: 1 });

    containerElement.dispatchEvent(pointerDownEvt);
    containerElement.dispatchEvent(pointerMoveEvt);
    containerElement.dispatchEvent(pointerUpEvt);

    expect(setPointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(resizeStartSpy).toHaveBeenCalledWith(pointerDownEvt, {
      resizeableElement: containerElement,
      resizeableHandleElement: containerElement,
    });
    expect(resizeSpy).toHaveBeenCalled();
    expect(resizeEndSpy).toHaveBeenCalled();
    expect(hasPointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
  });

  it('should ignore non-left mouse button with pointer events', () => {
    const resizeStartSpy = vi.fn();

    (window as any).PointerEvent = class PointerEventMock extends Event {};

    rsz = Resizable({
      resizeableElement: containerElement,
      resizeableHandleElement: containerElement,
      onResizeStart: resizeStartSpy,
    });

    const pointerDownEvt = new Event('pointerdown');
    Object.defineProperty(pointerDownEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(pointerDownEvt, 'button', { writable: true, configurable: true, value: 1 });
    Object.defineProperty(pointerDownEvt, 'pointerId', { writable: true, configurable: true, value: 11 });

    containerElement.dispatchEvent(pointerDownEvt);

    expect(resizeStartSpy).not.toHaveBeenCalled();
  });

  it('should release pointer capture when pointer resize start is cancelled', () => {
    const resizeStartSpy = vi.fn().mockReturnValue(false);
    const releasePointerCaptureSpy = vi.fn();

    (window as any).PointerEvent = class PointerEventMock extends Event {};
    (containerElement as any).releasePointerCapture = releasePointerCaptureSpy;

    rsz = Resizable({
      resizeableElement: containerElement,
      resizeableHandleElement: containerElement,
      onResizeStart: resizeStartSpy,
    });

    const pointerDownEvt = new Event('pointerdown');
    Object.defineProperty(pointerDownEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(pointerDownEvt, 'button', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(pointerDownEvt, 'pointerId', { writable: true, configurable: true, value: 3 });

    containerElement.dispatchEvent(pointerDownEvt);

    expect(resizeStartSpy).toHaveBeenCalledTimes(1);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(3);
  });

  it('should ignore mousedown fallback while a pointer interaction is active', () => {
    const resizeStartSpy = vi.fn();

    (window as any).PointerEvent = class PointerEventMock extends Event {};

    rsz = Resizable({
      resizeableElement: containerElement,
      resizeableHandleElement: containerElement,
      onResizeStart: resizeStartSpy,
    });

    const pointerDownEvt = new Event('pointerdown');
    Object.defineProperty(pointerDownEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(pointerDownEvt, 'button', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(pointerDownEvt, 'pointerId', { writable: true, configurable: true, value: 5 });
    containerElement.dispatchEvent(pointerDownEvt);

    containerElement.dispatchEvent(new MouseEvent('mousedown'));

    expect(resizeStartSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore pointer move/up events from a different pointer id', () => {
    const resizeSpy = vi.fn();
    const resizeEndSpy = vi.fn();

    (window as any).PointerEvent = class PointerEventMock extends Event {};

    rsz = Resizable({
      resizeableElement: containerElement,
      resizeableHandleElement: containerElement,
      onResize: resizeSpy,
      onResizeEnd: resizeEndSpy,
    });

    const pointerDownEvt = new Event('pointerdown');
    Object.defineProperty(pointerDownEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(pointerDownEvt, 'button', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(pointerDownEvt, 'pointerId', { writable: true, configurable: true, value: 7 });
    containerElement.dispatchEvent(pointerDownEvt);

    const wrongPointerMoveEvt = new Event('pointermove');
    Object.defineProperty(wrongPointerMoveEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(wrongPointerMoveEvt, 'pointerId', { writable: true, configurable: true, value: 8 });
    containerElement.dispatchEvent(wrongPointerMoveEvt);

    const wrongPointerUpEvt = new Event('pointerup');
    Object.defineProperty(wrongPointerUpEvt, 'pointerType', { writable: true, configurable: true, value: 'mouse' });
    Object.defineProperty(wrongPointerUpEvt, 'pointerId', { writable: true, configurable: true, value: 8 });
    containerElement.dispatchEvent(wrongPointerUpEvt);

    expect(resizeSpy).not.toHaveBeenCalled();
    expect(resizeEndSpy).not.toHaveBeenCalled();
  });

  it('should handle touch pointer move without preventing default', () => {
    const resizeSpy = vi.fn();

    (window as any).PointerEvent = class PointerEventMock extends Event {};

    rsz = Resizable({
      resizeableElement: containerElement,
      resizeableHandleElement: containerElement,
      onResize: resizeSpy,
    });

    const pointerDownEvt = new Event('pointerdown');
    Object.defineProperty(pointerDownEvt, 'pointerType', { writable: true, configurable: true, value: 'touch' });
    Object.defineProperty(pointerDownEvt, 'button', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(pointerDownEvt, 'pointerId', { writable: true, configurable: true, value: 9 });
    containerElement.dispatchEvent(pointerDownEvt);

    const pointerMoveEvt = new Event('pointermove');
    Object.defineProperty(pointerMoveEvt, 'pointerType', { writable: true, configurable: true, value: 'touch' });
    Object.defineProperty(pointerMoveEvt, 'pointerId', { writable: true, configurable: true, value: 9 });
    const preventDefaultSpy = vi.fn();
    Object.defineProperty(pointerMoveEvt, 'preventDefault', { writable: true, configurable: true, value: preventDefaultSpy });
    containerElement.dispatchEvent(pointerMoveEvt);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(resizeSpy).toHaveBeenCalled();
  });
});
