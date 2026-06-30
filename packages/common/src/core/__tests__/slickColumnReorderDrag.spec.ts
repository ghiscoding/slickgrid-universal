import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupColumnReorderDrag } from '../slickColumnReorderDrag.js';

describe('slickColumnReorderDrag', () => {
  const createHeaderColumn = (id: string, extraClass = '') => {
    const elm = document.createElement('div');
    elm.className = `slick-header-column ${extraClass}`.trim();
    elm.dataset.id = id;
    elm.textContent = id;
    return elm;
  };

  const createDragEvent = (type: string, props: Partial<Record<string, unknown>> = {}) => {
    const evt = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
    for (const [key, value] of Object.entries(props)) {
      Object.defineProperty(evt, key, { value, configurable: true, writable: true });
    }
    return evt;
  };

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should initialize draggable headers and clear draggable flags on destroy', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const orderable = createHeaderColumn('firstName');
    const unorderable = createHeaderColumn('lastName', 'unorderable');
    headerLeft.append(orderable, unorderable);

    const instance = setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      unorderableColumnCssClass: 'unorderable',
      onDragEnd: vi.fn(),
    });

    expect(orderable.draggable).toBe(true);
    expect(unorderable.draggable).toBe(false);

    instance.destroy();

    expect(orderable.draggable).toBe(false);
    expect(unorderable.draggable).toBe(false);
  });

  it('should prevent dragstart when event target is not a header column', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const onDragEnd = vi.fn();

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
    });

    const dragStartEvt = createDragEvent('dragstart');
    const preventDefaultSpy = vi.spyOn(dragStartEvt, 'preventDefault');
    headerLeft.dispatchEvent(dragStartEvt);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('should prevent default on dragover and skip when drag was never started', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const target = createHeaderColumn('age');
    headerLeft.append(target);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const dragOverEvt = createDragEvent('dragover', { clientX: 120 });
    const preventDefaultSpy = vi.spyOn(dragOverEvt, 'preventDefault');
    target.dispatchEvent(dragOverEvt);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(headerLeft.firstElementChild).toBe(target);
  });

  it('should move dragged header before target when cursor is in target left half', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    const age = createHeaderColumn('age');
    headerLeft.append(firstName, lastName, age);

    const onDragEnd = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
    });

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
      offsetX: 8,
      offsetY: 4,
    });
    firstName.dispatchEvent(dragStartEvt);

    vi.spyOn(lastName, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 40,
      right: 140,
      top: 0,
      bottom: 0,
      x: 100,
      y: 0,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);

    const dragOverEvt = createDragEvent('dragover', { clientX: 110 }); // left side of lastName
    lastName.dispatchEvent(dragOverEvt);

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName', 'age']);

    const dragEndEvt = createDragEvent('dragend');
    firstName.dispatchEvent(dragEndEvt);
    expect(onDragEnd).toHaveBeenCalledWith(['firstName', 'lastName', 'age']);
  });

  it('should ignore dragover when target is the same dragged header element', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    headerLeft.append(firstName, lastName);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
      offsetX: 5,
      offsetY: 3,
    });
    firstName.dispatchEvent(dragStartEvt);

    const dragOverEvt = createDragEvent('dragover', { clientX: 10 });
    firstName.dispatchEvent(dragOverEvt);

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName']);
  });

  it('should move dragged header after target when cursor is in target right half', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    const age = createHeaderColumn('age');
    headerLeft.append(firstName, lastName, age);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
      offsetX: 8,
      offsetY: 4,
    });
    firstName.dispatchEvent(dragStartEvt);

    vi.spyOn(lastName, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 40,
      right: 140,
      top: 0,
      bottom: 0,
      x: 100,
      y: 0,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);

    const dragOverEvt = createDragEvent('dragover', { clientX: 139 }); // right side of lastName
    lastName.dispatchEvent(dragOverEvt);

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['lastName', 'firstName', 'age']);
  });

  it('should call setDragImage with rect-relative coords (Firefox/Linux ghost fix) on dragstart', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const setDragImageSpy = vi.fn();
    // Simulate the column header at left=50, top=10 in the viewport
    vi.spyOn(firstName, 'getBoundingClientRect').mockReturnValue({
      left: 50,
      top: 10,
      right: 130,
      bottom: 30,
      width: 80,
      height: 20,
      x: 50,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: setDragImageSpy },
      clientX: 60, // 10px inside the column header
      clientY: 15, // 5px inside the column header
    });
    firstName.dispatchEvent(dragStartEvt);

    // The ghost should be anchored at (clientX - rect.left, clientY - rect.top) = (10, 5)
    // NOT at e.offsetX / e.offsetY which would be relative to whichever child element was clicked
    expect(setDragImageSpy).toHaveBeenCalledWith(firstName, 10, 5);
  });
});
