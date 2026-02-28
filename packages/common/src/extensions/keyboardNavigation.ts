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
  /** Callback when ArrowRight is pressed on a submenu item (for dropright submenus) */
  onOpenSubMenu?: (focusedItem: HTMLElement) => void;
  /** Callback when ArrowLeft is pressed in a submenu (for dropleft submenus or to close dropright) */
  onCloseSubMenu?: (focusedItem: HTMLElement) => void;
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

  // Helper function to get visible/allowed items within the current menu context
  const getVisibleItems = (contextElm?: HTMLElement) => {
    // If contextElm is provided, use it as the menu container; otherwise, use containerElm
    const menuContainer = contextElm || containerElm;
    let items = Array.from(menuContainer.querySelectorAll(allItemsSelector)) as HTMLElement[];
    if (filterFn) {
      items = items.filter(filterFn);
    }
    return items.filter((item) => item.offsetParent !== null);
  };

  // IMPORTANT: Always use a group name (eventServiceKey) for event bindings.
  // To prevent memory leaks, call bindEventService.unbindAll(eventServiceKey) when the menu is closed/disposed.
  bindEventService.bind(
    containerElm,
    'keydown',
    ((evt: KeyboardEvent) => {
      // Only handle if this is a navigation key
      const isNavigationKey = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'Enter', ' ', 'Escape', 'Tab'].includes(evt.key);
      if (!isNavigationKey) {
        return;
      }

      // Try to find focused item
      let focusedItem = containerElm.querySelector(focusedItemSelector) as HTMLElement;
      if (focusedItem) {
        // Find the closest menu container (role="menu" or .slick-menu-level-*)
        let menuContainer = (focusedItem.closest('[role="menu"], .slick-submenu') as HTMLElement) || containerElm;
        if (containerElm.classList.contains('slick-grid-menu') && containerElm.classList.contains('slick-menu-level-0')) {
          menuContainer = containerElm; // if we're at the Grid Menu root, we need to include both Custom Commands & Column Picker items
        }
        // Get all focusable items, optionally filtered, within the current menu context
        let allItems = getVisibleItems(menuContainer);

        const currentIndex = allItems.indexOf(focusedItem);
        const stopBubbling = () => {
          evt.preventDefault();
          evt.stopPropagation();
        };

        // Precompute context for arrow events
        const isInSubMenu = focusedItem.closest('.slick-submenu');
        const isDropRight = focusedItem.closest('.dropright');
        const isDropLeft = focusedItem.closest('.dropleft');

        switch (evt.key) {
          case 'Tab':
            if (onTab) {
              onTab(evt, focusedItem);
            }
            break;
          case 'ArrowDown': {
            stopBubbling();
            const nextIndex = currentIndex < allItems.length - 1 ? currentIndex + 1 : 0;
            allItems[nextIndex]?.focus();
            break;
          }
          case 'ArrowUp': {
            stopBubbling();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : allItems.length - 1;
            allItems[prevIndex]?.focus();
            break;
          }
          case 'ArrowRight': {
            // Only handle if focusedItem is a submenu trigger and submenu is dropright
            const isSubMenuTrigger = focusedItem.classList.contains('slick-submenu-item');
            if (isSubMenuTrigger && isDropRight && typeof options.onOpenSubMenu === 'function') {
              stopBubbling();
              options.onOpenSubMenu(focusedItem);
            }
            break;
          }
          case 'ArrowLeft': {
            // Only handle if in a submenu and submenu is dropright or dropleft
            if (isInSubMenu && (isDropRight || isDropLeft) && typeof options.onCloseSubMenu === 'function') {
              stopBubbling();
              options.onCloseSubMenu(focusedItem);
            }
            break;
          }
          case 'Enter':
          case ' ': {
            const isSubMenuTrigger = focusedItem.classList.contains('slick-submenu-item');
            if (isSubMenuTrigger && isDropRight && typeof options.onOpenSubMenu === 'function') {
              stopBubbling();
              options.onOpenSubMenu(focusedItem);
            } else {
              stopBubbling();
              if (onActivate) {
                onActivate(focusedItem);
              }
            }
            break;
          }
          case 'Escape':
            stopBubbling();
            if (onEscape) {
              onEscape();
            }
            break;
        }
      }
    }) as EventListener,
    undefined,
    eventServiceKey
  );

  // Handle hover to focus items for better UX
  bindEventService.bind(
    containerElm,
    'mouseover',
    ((evt: MouseEvent) => {
      const target = evt.target as HTMLElement;
      // Use the closest menu container for hover focus as well
      const menuContainer = (target.closest('[role="menu"], .slick-submenu') as HTMLElement) || containerElm;
      const allItems = getVisibleItems(menuContainer);
      // Use closest to find the menu item element even if hovering on children
      const menuItem = target.closest(allItemsSelector) as HTMLElement;
      if (menuItem && allItems.includes(menuItem)) {
        menuItem.focus();
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
    onOpenSubMenu?: (focusedItem: HTMLElement) => void;
    onCloseSubMenu?: (focusedItem: HTMLElement) => void;
    eventServiceKey?: string;
    allItemsSelector?: string;
    focusedItemSelector?: string;
  }
): void {
  // Allow all menus, including GridMenu, to use keyboard navigation
  const defaultSelector =
    '[role="menuitem"]:not(.disabled, .hidden, .slick-menu-item-disabled, .slick-menu-item-divider, .slick-menu-item-hidden)';
  const allItemsSelector = options?.allItemsSelector || defaultSelector;
  const focusedItemSelector = (options?.focusedItemSelector || defaultSelector) + ':focus';
  if (!menuElm.dataset.keyboardNavBound && typeof bindKeyboardNavigation === 'function') {
    bindKeyboardNavigation(menuElm, bindEventService, {
      focusedItemSelector,
      allItemsSelector,
      filterFn: (item) => (item as HTMLElement).offsetParent !== null,
      onActivate: options?.onActivate,
      onEscape: options?.onEscape,
      onTab: options?.onTab,
      onOpenSubMenu: options?.onOpenSubMenu,
      onCloseSubMenu: options?.onCloseSubMenu,
      eventServiceKey: options?.eventServiceKey ?? 'menu-keyboard',
    });
    menuElm.dataset.keyboardNavBound = 'true';
  }
}
