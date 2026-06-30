import { getOffset } from '@slickgrid-universal/utils';

export interface ColumnReorderDragOption {
  /** Left header container (.slick-header-columns-left) */
  headerLeft: HTMLElement;
  /** Right header container (.slick-header-columns-right) */
  headerRight: HTMLElement;
  /** Grid container – used for the right-edge auto-scroll boundary */
  container: HTMLElement;
  /** Scrollable viewport – used for the left-edge boundary and actual scrolling */
  viewportScrollContainerX: HTMLElement;
  /** Returns true when the grid has frozen columns (determines which pane can auto-scroll) */
  hasFrozenColumns: () => boolean;
  /** CSS class that marks a column as non-reorderable */
  unorderableColumnCssClass?: string;
  /**
   * Called right after dragstart, before any DOM changes.
   * Use this to snapshot column state that your onDragEnd callback needs.
   */
  onDragStart?: (draggedEl: HTMLElement) => void;
  /**
   * Called when drag ends with the new visible-column ID order read from the DOM.
   * Responsible for applying the reorder (setColumns, triggerEvent, etc.).
   */
  onDragEnd: (reorderedIds: string[]) => void;
}

/**
 * Sets up native HTML5 drag-and-drop for column header reordering.
 *
 * Handles:
 * - Making orderable header columns draggable
 * - Live DOM reordering during dragover
 * - Browser-edge auto-scroll (left / right) during drag
 * - Firefox+Linux ghost rendering fix via explicit setDragImage
 * - Storing the dragged column's data-id in dataTransfer (for cross-container drops)
 *
 * @returns `{ destroy }` – call to remove all listeners and clear draggable attributes.
 */
export function setupColumnReorderDrag(options: ColumnReorderDragOption): { destroy: () => void } {
  const { headerLeft, headerRight, container, viewportScrollContainerX, unorderableColumnCssClass } = options;

  let columnScrollTimer: ReturnType<typeof setInterval> | undefined;
  let draggedEl: HTMLElement | null = null;

  const scrollColumnsRight = () => (viewportScrollContainerX.scrollLeft += 10);
  const scrollColumnsLeft = () => (viewportScrollContainerX.scrollLeft -= 10);
  const stopAutoScroll = () => {
    clearInterval(columnScrollTimer);
    columnScrollTimer = undefined;
  };

  const isDraggable = (el: HTMLElement): boolean =>
    el.classList.contains('slick-header-column') && (!unorderableColumnCssClass || !el.classList.contains(unorderableColumnCssClass));

  const getColumnIds = (parent: HTMLElement): string[] =>
    Array.from(parent.children)
      .filter((el) => isDraggable(el as HTMLElement))
      .map((el) => (el as HTMLElement).dataset.id ?? '')
      .filter(Boolean);

  // Set draggable attribute on all eligible header columns
  const refreshDraggable = (parent: HTMLElement) => {
    Array.from(parent.children as HTMLCollectionOf<HTMLElement>).forEach((el) => {
      if (el.classList.contains('slick-header-column')) {
        el.draggable = isDraggable(el);
      }
    });
  };
  refreshDraggable(headerLeft);
  refreshDraggable(headerRight);

  const autoScrollHandler = (e: DragEvent) => {
    const { clientX, clientY, pageX } = e;
    if (clientX && clientY) {
      const containerOffset = getOffset(container);
      const viewportLeft = getOffset(viewportScrollContainerX).left;
      const containerRight = containerOffset.left + container.clientWidth;
      if (!columnScrollTimer && pageX > containerRight) {
        columnScrollTimer = setInterval(scrollColumnsRight, 100);
      } else if (!columnScrollTimer && pageX < viewportLeft) {
        columnScrollTimer = setInterval(scrollColumnsLeft, 100);
      } else if (columnScrollTimer && pageX <= containerRight && pageX >= viewportLeft) {
        stopAutoScroll();
      }
    }
  };

  const onDragStart = (e: DragEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('.slick-header-column');
    if (!target || !isDraggable(target)) {
      e.preventDefault();
      return;
    }
    draggedEl = target;
    target.classList.add('slick-header-column-active');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // Store column id so the dropzone can identify which column was dragged
      if (typeof e.dataTransfer.setData === 'function') {
        e.dataTransfer.setData('text/plain', target.dataset.id ?? '');
      }
      // Explicit drag image avoids Firefox+Linux X11 ghost rendering issues.
      // Use clientX/Y minus the target rect to get the offset relative to the
      // actual column header element (e.offsetX/Y is relative to e.target which
      // may be a child span, causing a wrong ghost position on Firefox/Linux).
      if (typeof e.dataTransfer.setDragImage === 'function') {
        const rect = target.getBoundingClientRect();
        e.dataTransfer.setDragImage(target, e.clientX - rect.left, e.clientY - rect.top);
      }
    }

    options.onDragStart?.(target);

    // Only non-frozen columns should trigger browser-edge auto-scroll
    const canAutoScroll = !options.hasFrozenColumns() || headerRight.contains(target);
    if (canAutoScroll) {
      document.addEventListener('drag', autoScrollHandler as EventListener);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest<HTMLElement>('.slick-header-column');
    if (!draggedEl || !target || target === draggedEl || !isDraggable(target)) {
      return;
    }
    const rect = target.getBoundingClientRect();
    const insertBefore = e.clientX < rect.left + rect.width / 2;
    target.parentElement!.insertBefore(draggedEl, insertBefore ? target : target.nextSibling);
  };

  const onDragEnd = (e: DragEvent) => {
    if (draggedEl) {
      draggedEl.classList.remove('slick-header-column-active');
      draggedEl = null;
    }
    stopAutoScroll();
    document.removeEventListener('drag', autoScrollHandler as EventListener);

    const reorderedIds = getColumnIds(headerLeft).concat(getColumnIds(headerRight));
    e.stopPropagation();
    options.onDragEnd(reorderedIds);
  };

  for (const parent of [headerLeft, headerRight]) {
    parent.addEventListener('dragstart', onDragStart as EventListener);
    parent.addEventListener('dragover', onDragOver as EventListener);
    parent.addEventListener('dragend', onDragEnd as EventListener);
  }

  return {
    destroy() {
      for (const parent of [headerLeft, headerRight]) {
        parent.removeEventListener('dragstart', onDragStart as EventListener);
        parent.removeEventListener('dragover', onDragOver as EventListener);
        parent.removeEventListener('dragend', onDragEnd as EventListener);
      }
      document.removeEventListener('drag', autoScrollHandler as EventListener);
      stopAutoScroll();
      draggedEl = null;
      [headerLeft, headerRight].forEach((parent) =>
        Array.from(parent.querySelectorAll<HTMLElement>('.slick-header-column')).forEach((el) => (el.draggable = false))
      );
    },
  };
}
