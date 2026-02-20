import type { BindingEventService } from '@slickgrid-universal/binding';

/**
 * Configuration options for keyboard navigation
 */
export interface KeyboardNavigationOptions {
  /** CSS selector to find currently focused item (e.g., '[role="menuitem"]:focus' or '.list-item:focus') */
  focusedItemSelector: string;
  /** CSS selector to find all focusable items (e.g., '[role="menuitem"]' or '.list-item') */
  allItemsSelector: string;
  /** Optional filter function to exclude items (disabled, hidden, etc.) */
  filterFn?: (item: HTMLElement) => boolean;
  /** Callback when Enter/Space is pressed on focused item */
  onActivate?: (focusedItem: HTMLElement) => void;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Callback when Tab or Shift+Tab is pressed */
  onTab?: (evt: KeyboardEvent, focusedItem: HTMLElement) => void;
  /** Key for binding event service (default: 'keyboard-navigation') */
  eventServiceKey?: string;
}

/**
 * Generic keyboard navigation handler for list-like components
 * Supports arrow key navigation, Enter/Space activation, and Escape to close
 * Can be used for menus, lists, pickers, or any focusable item collections
 */
export function bindKeyboardNavigation(
  containerElm: HTMLElement,
  bindEventService: BindingEventService,
  options: KeyboardNavigationOptions
): void {
  const { focusedItemSelector, allItemsSelector, filterFn, onActivate, onEscape, onTab, eventServiceKey = 'keyboard-navigation' } = options;

  bindEventService.bind(
    containerElm,
    'keydown',
    ((evt: KeyboardEvent) => {
      // Only handle if this is a navigation key
      const isNavigationKey = ['ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape', 'Tab'].includes(evt.key);
      if (!isNavigationKey) return;

      // Try to find focused item
      let focusedItem = containerElm.querySelector(focusedItemSelector) as HTMLElement;
      if (!focusedItem) {
        return;
      }

      // Get all focusable items, optionally filtered
      let allItems = Array.from(containerElm.querySelectorAll(allItemsSelector)) as HTMLElement[];
      if (filterFn) {
        allItems = allItems.filter(filterFn);
      }

      const currentIndex = allItems.indexOf(focusedItem);
      const stopBubbling = () => {
        evt.preventDefault();
        evt.stopPropagation();
      };

      switch (evt.key) {
        case 'Tab':
          if (onTab) {
            onTab(evt, focusedItem);
          }
          break;
        case 'ArrowDown':
          stopBubbling();
          if (currentIndex < allItems.length - 1) {
            allItems[currentIndex + 1]?.focus();
          } else {
            allItems[0]?.focus();
          }
          break;
        case 'ArrowUp':
          stopBubbling();
          if (currentIndex > 0) {
            allItems[currentIndex - 1]?.focus();
          } else {
            allItems[allItems.length - 1]?.focus();
          }
          break;
        case 'Enter':
        case ' ':
          stopBubbling();
          if (onActivate) {
            onActivate(focusedItem);
          }
          break;
        case 'Escape':
          stopBubbling();
          if (onEscape) {
            onEscape();
          }
          break;
      }
    }) as EventListener,
    undefined,
    eventServiceKey
  );
}

/**
 * Wire up keyboard navigation for the menu container using bindKeyboardNavigation.
 * Should be called after menu DOM is created for all non-GridMenu plugins.
 */
export function wireMenuKeyboardNavigation(
  menuElm: HTMLElement,
  bindEventService: any,
  options?: {
    onActivate?: (focusedItem: HTMLElement) => void;
    onEscape?: () => void;
    onTab?: (evt: KeyboardEvent, focusedItem: HTMLElement) => void;
    eventServiceKey?: string;
    allItemsSelector?: string;
    focusedItemSelector?: string;
  }
): void {
  // Allow all menus, including GridMenu, to use keyboard navigation
  const defaultSelector = '[role="menuitem"]:not(.slick-menu-item-divider):not(.disabled):not(.slick-menu-item-hidden)';
  const allItemsSelector = options?.allItemsSelector || defaultSelector;
  const focusedItemSelector = (options?.focusedItemSelector || defaultSelector) + ':focus';
  if (!menuElm.dataset.keyboardNavBound) {
    if (typeof bindKeyboardNavigation === 'function') {
      bindKeyboardNavigation(menuElm, bindEventService, {
        focusedItemSelector,
        allItemsSelector,
        filterFn: (item) => (item as HTMLElement).offsetParent !== null,
        onActivate: options?.onActivate,
        onEscape: options?.onEscape,
        onTab: options?.onTab,
        eventServiceKey: options?.eventServiceKey ?? 'menu-keyboard',
      });
      menuElm.dataset.keyboardNavBound = 'true';
    }
  }
}
