import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Wire up keyboard navigation (this will use the filterFn)
import { bindKeyboardNavigation, wireMenuKeyboardNavigation } from '../keyboardNavigation';

// Minimal fake BindingEventService
class FakeBindingEventService {
  bindCalls: any[] = [];
  bind(el: HTMLElement, event: string, handler: EventListener) {
    this.bindCalls.push({ el, event, handler });
    el.addEventListener(event, handler);
  }
}

describe('bindKeyboardNavigation', () => {
  let container: HTMLElement;
  let items: HTMLElement[];
  let service: FakeBindingEventService;

  beforeEach(() => {
    container = document.createElement('div');
    container.tabIndex = 0;
    items = [];
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div');
      item.setAttribute('role', 'menuitem');
      item.tabIndex = 0;
      item.textContent = `Item ${i}`;
      items.push(item);
      container.appendChild(item);
    }
    document.body.appendChild(container);
    service = new FakeBindingEventService();
  });

  afterEach(() => {
    container.remove();
  });

  it('should move focus with ArrowDown and ArrowUp', () => {
    bindKeyboardNavigation(container, service as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });
    // Focus first item
    items[0].focus();
    expect(document.activeElement).toBe(items[0]);

    // ArrowDown moves to second item
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    container.dispatchEvent(downEvent);
    expect(document.activeElement).toBe(items[1]);

    // ArrowDown moves to third item
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);

    // ArrowDown wraps to first item
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);

    // ArrowUp wraps to last item
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);

    // ArrowUp moves to second item
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
  });

  it('should cover focusedItem and allItems logic (lines 42, 48) using querySelector spy', () => {
    // Spy before binding or focusing
    const qsSpy = vi.spyOn(container, 'querySelector').mockImplementation((selector: string) => {
      if (selector.endsWith(':focus')) return items[0];
      return null;
    });
    const qsaSpy = vi.spyOn(container, 'querySelectorAll').mockImplementation(() => items as any);

    bindKeyboardNavigation(container, service as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });

    // Dispatch ArrowDown to trigger the code path
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    container.dispatchEvent(downEvent);

    expect(qsSpy).toHaveBeenCalledWith('[role="menuitem"]:focus');
    expect(qsaSpy).toHaveBeenCalledWith('[role="menuitem"]');

    qsSpy.mockRestore();
    qsaSpy.mockRestore();
  });

  it('should return early for non-navigation keys', () => {
    bindKeyboardNavigation(container, service as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });
    // Focus first item
    items[0].focus();
    // Dispatch a non-navigation key
    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    container.dispatchEvent(event);
    // No error, no focus change, just covers the early return
    expect(document.activeElement).toBe(items[0]);
  });

  it('should filter out hidden items using filterFn in wireMenuKeyboardNavigation', () => {
    // Create a menu container and two items, one hidden
    const menu = document.createElement('div');
    menu.tabIndex = 0;
    const visible = document.createElement('div');
    visible.setAttribute('role', 'menuitem');
    visible.tabIndex = 0;
    visible.textContent = 'Visible';
    const hidden = document.createElement('div');
    hidden.setAttribute('role', 'menuitem');
    hidden.tabIndex = 0;
    hidden.textContent = 'Hidden';
    hidden.style.display = 'none';
    menu.appendChild(visible);
    menu.appendChild(hidden);
    document.body.appendChild(menu);
    // Minimal fake BindingEventService
    const fakeService = { bind: (el: HTMLElement, event: string, handler: EventListener) => el.addEventListener(event, handler) };
    // Focus the visible item
    visible.focus();

    wireMenuKeyboardNavigation(menu, fakeService);
    // Dispatch ArrowDown (should not focus hidden)
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    menu.dispatchEvent(event);
    // Only the visible item should be focusable
    expect(document.activeElement).toBe(visible);
    menu.remove();
  });
});
