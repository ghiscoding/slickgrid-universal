import { getOffset } from '@slickgrid-universal/utils';
import type { ColumnReorderDragOption, DropzonePillDragOption } from '../interfaces/slickColumnReorderDrag.interfaces.js';

/** Extract { clientX, clientY, pageX } from any pointer-like event.
 * DragEvent inherits clientX/pageX from MouseEvent; TouchEvent uses touches[0] (or
 * changedTouches[0] for touchend/touchcancel where touches is empty). */
const getPointerPos = (e: DragEvent | MouseEvent | TouchEvent) => {
  if ('touches' in e) {
    const t = e.touches[0] ?? e.changedTouches[0];
    return { clientX: t?.clientX ?? 0, clientY: t?.clientY ?? 0, pageX: t?.pageX ?? 0 };
  }
  return { clientX: e.clientX, clientY: e.clientY, pageX: e.pageX };
};

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
  const dragActiveClass = options.dragActiveClass ?? 'slick-header-column-active';
  const draggableSelector = options.draggableSelector ?? '.slick-header-column';
  const dropzoneSelector = options.dropzoneSelector ?? '.slick-dropzone';
  const dropzoneHoverClass = options.dropzoneHoverClass ?? 'slick-dropzone-hover';
  const DRAG_THRESHOLD = 5; // pixels before we consider it a drag, not a click
  const INTERVAL_TIME = 100; // ms for browser-edge auto-scroll

  let columnScrollTimer: ReturnType<typeof setInterval> | undefined;
  let draggedEl: HTMLElement | null = null;
  let originalParent: Node | null = null;
  let originalNextSibling: ChildNode | null = null;
  let dropzoneTargetActive = false;
  let draggedColumnId = '';
  let _lastClientX: number | null = null;
  let dragGhost: HTMLElement | null = null;
  let dragStartX: number | null = null;
  let dragStartY: number | null = null;
  let pointerDragCommitted = false;

  const isOverDropzone = (el: HTMLElement | null | undefined): boolean => !!el?.closest?.(dropzoneSelector);
  const scrollColumnsRight = () => (viewportScrollContainerX.scrollLeft += 10);
  const scrollColumnsLeft = () => (viewportScrollContainerX.scrollLeft -= 10);
  const stopAutoScroll = () => {
    clearInterval(columnScrollTimer);
    columnScrollTimer = undefined;
  };

  const restoreDraggedToOriginalParent = () => {
    if (originalParent && draggedEl && draggedEl.parentElement !== originalParent) {
      originalParent.insertBefore(draggedEl, originalNextSibling as Node | null);
    }
  };

  const toggleDropzoneHoverClass = (el: HTMLElement | null | undefined, isActive: boolean) => {
    const dropzone = el?.closest?.(dropzoneSelector) as HTMLElement | null;
    dropzone?.classList.toggle(dropzoneHoverClass, isActive);
  };

  const clearDropzoneHoverClasses = () => {
    document.querySelectorAll<HTMLElement>(dropzoneSelector).forEach((el) => el.classList.remove(dropzoneHoverClass));
  };

  const safely = (operation: () => void, onError?: (error: unknown) => void) => {
    try {
      operation();
    } catch (error) {
      onError?.(error);
    }
  };

  const isDragStartIgnoredTarget = (el: HTMLElement | null, event: DragEvent | MouseEvent | TouchEvent): boolean => {
    const dragStartFilter = options.dragStartFilter;
    return typeof dragStartFilter === 'function'
      ? !!dragStartFilter(el, event)
      : typeof dragStartFilter === 'string' && dragStartFilter.trim()
        ? !!el?.closest?.(dragStartFilter)
        : false;
  };

  const reorderDraggedAgainstTarget = (target: HTMLElement, clientX: number) => {
    if (!draggedEl || target === draggedEl || !isDraggable(target)) {
      return;
    }

    const targetParent = target.parentElement;
    if (!targetParent || (!headerLeft.contains(targetParent) && !headerRight.contains(targetParent))) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const movingRight = _lastClientX == null ? clientX >= rect.left + rect.width / 2 : clientX > _lastClientX;
    _lastClientX = clientX;
    const insertBefore = !movingRight;
    targetParent.insertBefore(draggedEl, insertBefore ? target : target.nextSibling);
  };

  const isDraggable = (el: HTMLElement): boolean =>
    el.matches(draggableSelector) && (!unorderableColumnCssClass || !el.classList.contains(unorderableColumnCssClass));

  // Mirror SortableJS's Firefox/Linux fallback detection so the mouse-based path is used only for the broken browser combo.
  const isFfLinux = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent) && /linux/i.test(navigator.userAgent);

  const getColumnIds = (parent: HTMLElement): string[] =>
    Array.from(parent.children)
      .filter((el) => isDraggable(el as HTMLElement))
      .map((el) => (el as HTMLElement).dataset.id ?? '')
      .filter(Boolean);

  // Set draggable attribute on all eligible header columns
  const refreshDraggable = (parent: HTMLElement) => {
    Array.from(parent.children as HTMLCollectionOf<HTMLElement>).forEach((el) => {
      if (el.matches(draggableSelector)) {
        // Disable native HTML5 drag on Firefox/Linux and use mouse fallback
        el.draggable = isDraggable(el) && !isFfLinux;
      }
    });
  };
  refreshDraggable(headerLeft);
  refreshDraggable(headerRight);

  const autoScrollHandler = (e: DragEvent) => {
    const { clientX, clientY, pageX } = e;
    if (clientX != null && clientY != null) {
      const containerOffset = getOffset(container);
      const viewportLeft = getOffset(viewportScrollContainerX).left;
      const containerRight = containerOffset.left + container.clientWidth;
      if (!columnScrollTimer && pageX > containerRight) {
        columnScrollTimer = setInterval(scrollColumnsRight, INTERVAL_TIME);
      } else if (!columnScrollTimer && pageX < viewportLeft) {
        columnScrollTimer = setInterval(scrollColumnsLeft, INTERVAL_TIME);
      } else if (columnScrollTimer && pageX <= containerRight && pageX >= viewportLeft) {
        stopAutoScroll();
      }
    }
  };

  const clearDropzoneTarget = () => (dropzoneTargetActive = false);
  const clearFallbackGhost = () => {
    dragGhost?.parentElement?.removeChild(dragGhost);
    dragGhost = null;
  };

  const resetDragState = () => {
    draggedEl = null;
    originalParent = null;
    originalNextSibling = null;
    draggedColumnId = '';
    _lastClientX = null;
    dragStartX = null;
    dragStartY = null;
    pointerDragCommitted = false;
    clearDropzoneTarget();
    clearDropzoneHoverClasses();
    clearFallbackGhost();
  };

  const createFallbackGhost = (source: HTMLElement, clientX: number, clientY: number) => {
    clearFallbackGhost();
    const rect = source.getBoundingClientRect();
    dragGhost = source.cloneNode(true) as HTMLElement;
    dragGhost.classList.add('slick-header-column-drag-ghost');
    // Explicitly set dimensions and styles so the ghost renders correctly outside its original container
    dragGhost.style.width = `${rect.width}px`;
    dragGhost.style.height = `${rect.height}px`;
    dragGhost.style.opacity = '0.8';
    dragGhost.style.left = `${clientX}px`;
    dragGhost.style.top = `${clientY}px`;
    document.body.appendChild(dragGhost);
  };

  const updateFallbackGhost = (clientX: number, clientY: number) => {
    if (dragGhost) {
      dragGhost.style.left = `${clientX}px`;
      dragGhost.style.top = `${clientY}px`;
    }
  };

  const onDropzoneDragEnter = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (draggedEl && isOverDropzone(target)) {
      dropzoneTargetActive = true;
      toggleDropzoneHoverClass(target, true);
      // Ensure the dragged header remains in the header DOM (non-destructive)
      safely(() => {
        restoreDraggedToOriginalParent();
      });
    }
  };

  const onDropzoneDragLeave = (e: DragEvent) => {
    const target = e.target as HTMLElement | null;
    const relatedTarget =
      (e.relatedTarget as HTMLElement | null) ??
      (e.clientX != null && e.clientY != null ? (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null) : null);
    if (isOverDropzone(target) && !isOverDropzone(relatedTarget)) {
      dropzoneTargetActive = false;
      toggleDropzoneHoverClass(target, false);
    }
  };

  document.addEventListener('dragenter', onDropzoneDragEnter as EventListener);
  document.addEventListener('dragleave', onDropzoneDragLeave as EventListener);

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    const overDropzone = isOverDropzone(e.target as HTMLElement | null);
    if (overDropzone) {
      dropzoneTargetActive = true;
      toggleDropzoneHoverClass(e.target as HTMLElement | null, true);
      // Keep the dragged header visible in the original header DOM while over the dropzone
      safely(() => {
        restoreDraggedToOriginalParent();
      });
      return;
    }

    clearDropzoneHoverClasses();

    const target = (e.target as HTMLElement).closest<HTMLElement>(draggableSelector);
    if (target) {
      reorderDraggedAgainstTarget(target, e.clientX);
    }
  };

  const onDragEnd = (e: DragEvent) => {
    const draggedHeader = draggedEl;
    draggedHeader?.classList.remove(dragActiveClass);
    stopAutoScroll();
    document.removeEventListener('drag', autoScrollHandler as EventListener);

    // If the drop happened over an external dropzone (eg. DraggableGrouping), the header
    // may have been moved out of the header DOM during dragover. Detect that and
    // restore the header to its original parent to avoid permanently removing the column
    // from the grid's column list when we read column order from the DOM.
    let droppedOnDropzone = dropzoneTargetActive;
    safely(
      () => {
        if (!droppedOnDropzone && e.clientX != null && e.clientY != null) {
          const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
          if (el && el.closest && el.closest(dropzoneSelector)) {
            droppedOnDropzone = true;
          }
        }
      },
      () => {
        droppedOnDropzone = false;
      }
    );

    if (droppedOnDropzone && draggedHeader && originalParent) {
      // restore the header DOM to its original location
      originalParent.insertBefore(draggedHeader, originalNextSibling as Node | null);
    }

    const reorderedIds = getColumnIds(headerLeft).concat(getColumnIds(headerRight));
    e.stopPropagation();
    if (droppedOnDropzone && draggedHeader) {
      options.onDrop?.(draggedHeader, e, draggedColumnId);
    } else {
      options.onDragEnd(reorderedIds);
    }
    // clear stored original position
    resetDragState();
  };

  // Firefox/Linux native HTML5 drag is broken; touch screens never fire HTML5 drag events.
  // All three start events (dragstart, mousedown, touchstart) share one handler.

  const onStart = (e: DragEvent | MouseEvent | TouchEvent) => {
    const { clientX, clientY } = getPointerPos(e);
    const eventTarget = e.target as HTMLElement | null;
    const cancelNativeDragIfNeeded = (e: DragEvent | MouseEvent | TouchEvent) => {
      if (e.type === 'dragstart') {
        e.preventDefault();
      }
    };

    if (isDragStartIgnoredTarget(eventTarget, e)) {
      cancelNativeDragIfNeeded(e);
      return;
    }
    const target = eventTarget?.closest<HTMLElement>(draggableSelector);
    if (!target || !isDraggable(target)) {
      // Cancel a native drag that started on a non-orderable column
      cancelNativeDragIfNeeded(e);
      return;
    }
    // Common state setup
    draggedEl = target;
    draggedColumnId = target.dataset.id ?? '';
    clearDropzoneTarget();
    originalParent = target.parentElement;
    originalNextSibling = target.nextSibling;
    if (e.type === 'dragstart') {
      options.onDragStart?.(target);
    }
    _lastClientX = clientX;

    if (e.type === 'dragstart') {
      // Native HTML5 drag: configure dataTransfer and auto-scroll
      // Add class immediately for native drag since it's committed
      target.classList.add(dragActiveClass);
      const de = e as DragEvent;
      if (de.dataTransfer) {
        de.dataTransfer.effectAllowed = 'move';
        // Store column id so the dropzone can identify which column was dragged
        if (typeof de.dataTransfer.setData === 'function') {
          de.dataTransfer.setData('text/plain', target.dataset.id ?? '');
        }
        // Explicit drag image avoids Firefox+Linux ghost rendering issues.
        // Use clientX/Y minus the target rect to get the offset relative to the
        // actual column header element (e.offsetX/Y is relative to e.target which
        // may be a child span, causing a wrong ghost position on Firefox/Linux).
        if (typeof de.dataTransfer.setDragImage === 'function') {
          const rect = target.getBoundingClientRect();
          de.dataTransfer.setDragImage(target, clientX - rect.left, clientY - rect.top);
        }
      }
      // Only non-frozen columns should trigger browser-edge auto-scroll
      const canAutoScroll = !options.hasFrozenColumns() || headerRight.contains(target);
      if (canAutoScroll) {
        document.addEventListener('drag', autoScrollHandler as EventListener);
      }
    } else {
      // Pointer fallback (mouse on FF/Linux, touch on all platforms)
      dragStartX = clientX;
      dragStartY = clientY;
      pointerDragCommitted = false;
      if ('touches' in e) {
        document.addEventListener('touchmove', onPointerMove as EventListener, { passive: false });
        document.addEventListener('touchend', onPointerUp as EventListener);
        document.addEventListener('touchcancel', onPointerUp as EventListener);
      } else {
        document.addEventListener('mousemove', onPointerMove as EventListener);
        document.addEventListener('mouseup', onPointerUp as EventListener);
      }
    }
  };

  const onPointerMove = (e: MouseEvent | TouchEvent) => {
    if (draggedEl && dragStartX != null && dragStartY != null) {
      const { clientX, clientY, pageX } = getPointerPos(e);

      // Check if we've exceeded the drag threshold
      if (!pointerDragCommitted) {
        const deltaX = Math.abs(clientX - dragStartX);
        const deltaY = Math.abs(clientY - dragStartY);
        if (deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD) {
          // Haven't moved far enough yet - don't commit to drag
          return;
        }
        // Threshold exceeded - now commit to drag
        e.preventDefault();
        options.onDragStart?.(draggedEl);
        createFallbackGhost(draggedEl, clientX, clientY);
        draggedEl.classList.add(dragActiveClass);
        // Disable text selection only after drag intent is confirmed
        document.body.style.userSelect = 'none';
        pointerDragCommitted = true;
      }

      // Always update ghost position for visual feedback once drag is committed
      updateFallbackGhost(clientX, clientY);

      e.preventDefault();

      // browser-edge auto-scroll
      const containerOffset = getOffset(container);
      const viewportLeft = getOffset(viewportScrollContainerX).left;
      const containerRight = containerOffset.left + container.clientWidth;
      if (!columnScrollTimer && pageX > containerRight) {
        columnScrollTimer = setInterval(scrollColumnsRight, INTERVAL_TIME);
      } else if (!columnScrollTimer && pageX < viewportLeft) {
        columnScrollTimer = setInterval(scrollColumnsLeft, INTERVAL_TIME);
      } else if (columnScrollTimer && pageX <= containerRight && pageX >= viewportLeft) {
        stopAutoScroll();
      }

      const elUnder = (() => {
        // Hide ghost temporarily so elementFromPoint doesn't hit it
        if (dragGhost) {
          dragGhost.style.display = 'none';
        }
        const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
        if (dragGhost) {
          dragGhost.style.display = '';
        }
        return el;
      })();
      const overDropzone = isOverDropzone(elUnder);
      if (overDropzone) {
        dropzoneTargetActive = true;
        toggleDropzoneHoverClass(elUnder, true);
      } else {
        dropzoneTargetActive = false;
        clearDropzoneHoverClasses();
        const targetHeader = elUnder?.closest?.(draggableSelector) as HTMLElement | null;
        if (targetHeader) {
          safely(() => {
            reorderDraggedAgainstTarget(targetHeader, clientX);
          });
        }
      }
    }
  };

  const cleanupPointerListeners = () => {
    document.removeEventListener('mousemove', onPointerMove as EventListener);
    document.removeEventListener('mouseup', onPointerUp as EventListener);
    document.removeEventListener('touchmove', onPointerMove as EventListener);
    document.removeEventListener('touchend', onPointerUp as EventListener);
    document.removeEventListener('touchcancel', onPointerUp as EventListener);
  };

  const onPointerUp = (e: MouseEvent | TouchEvent) => {
    cleanupPointerListeners();
    const draggedHeader = draggedEl;
    draggedHeader?.classList.remove(dragActiveClass);
    stopAutoScroll();

    const { clientX, clientY } = getPointerPos(e);
    let droppedOnDropzone = dropzoneTargetActive;
    safely(
      () => {
        if (!droppedOnDropzone) {
          const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
          if (el?.closest?.(dropzoneSelector)) {
            droppedOnDropzone = true;
          }
        }
      },
      () => {
        droppedOnDropzone = false;
      }
    );
    const originalParentNode = originalParent;
    const originalSiblingNode = originalNextSibling;
    if (droppedOnDropzone && draggedHeader && originalParentNode) {
      safely(() => {
        originalParentNode.insertBefore(draggedHeader, originalSiblingNode as Node | null);
      });
    }
    const reorderedIds = getColumnIds(headerLeft).concat(getColumnIds(headerRight));
    if (pointerDragCommitted && droppedOnDropzone && draggedHeader) {
      options.onDrop?.(draggedHeader, e, draggedColumnId);
    } else if (pointerDragCommitted) {
      options.onDragEnd(reorderedIds);
    }
    resetDragState();
    // Re-enable text selection after drag completes
    document.body.style.userSelect = '';
  };

  for (const parent of [headerLeft, headerRight]) {
    parent.addEventListener('dragstart', onStart as EventListener);
    parent.addEventListener('dragover', onDragOver as EventListener);
    parent.addEventListener('dragend', onDragEnd as EventListener);
    if (isFfLinux) {
      // Mouse-based fallback for Firefox on Linux
      parent.addEventListener('mousedown', onStart as EventListener, true);
    }
    // Touch fallback for all platforms (touch screens don't fire HTML5 drag events)
    parent.addEventListener('touchstart', onStart as EventListener, { passive: false });
  }

  return {
    destroy() {
      for (const parent of [headerLeft, headerRight]) {
        parent.removeEventListener('dragstart', onStart as EventListener);
        parent.removeEventListener('dragover', onDragOver as EventListener);
        parent.removeEventListener('dragend', onDragEnd as EventListener);
        if (isFfLinux) {
          parent.removeEventListener('mousedown', onStart as EventListener, true);
        }
        parent.removeEventListener('touchstart', onStart as EventListener);
      }
      document.removeEventListener('drag', autoScrollHandler as EventListener);
      cleanupPointerListeners();
      document.removeEventListener('dragenter', onDropzoneDragEnter as EventListener);
      document.removeEventListener('dragleave', onDropzoneDragLeave as EventListener);
      stopAutoScroll();
      resetDragState();
      [headerLeft, headerRight].forEach((parent) =>
        Array.from(parent.querySelectorAll<HTMLElement>(draggableSelector)).forEach((el) => {
          el.draggable = false;
          el.classList.remove(dragActiveClass);
        })
      );
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Dropzone pill drag (used by DraggableGrouping to reorder group pills)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Sets up drag-and-drop for reordering group pills inside a dropzone, plus
 * accepting column-header drops that create new group pills.
 *
 * All Firefox+Linux detection and mouse-based fallback are handled internally;
 * callers do not need to know about the browser quirk.
 *
 * @returns `{ destroy }` – call to remove all listeners.
 */
export function setupDropzonePillDrag(options: DropzonePillDragOption): { destroy: () => void } {
  const { dropzoneElm } = options;
  const itemSelector = options.itemSelector ?? '.slick-dropped-grouping';
  const draggingCssClass = options.draggingCssClass ?? '';
  const DRAG_THRESHOLD = 5; // pixels before we consider it a drag, not a click

  const userAgent = (typeof window !== 'undefined' ? window.navigator : navigator)?.userAgent ?? '';
  const isFfLinux = /firefox/i.test(userAgent) && /linux/i.test(userAgent);

  let draggedPill: HTMLElement | null = null;
  let fallbackActive = false;
  let dragStartX: number | null = null;
  let dragStartY: number | null = null;

  // ── Native pill drag ──────────────────────────────────────────────────────

  const onDragStart = (e: DragEvent) => {
    const pill = (e.target as HTMLElement).closest<HTMLElement>(itemSelector);
    if (pill) {
      draggedPill = pill;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        if (typeof e.dataTransfer.setData === 'function') {
          e.dataTransfer.setData('text/plain', pill.dataset.id ?? '');
        }
        // Explicit drag image avoids Firefox+Linux ghost rendering issues
        if (typeof e.dataTransfer.setDragImage === 'function') {
          const rect = pill.getBoundingClientRect();
          e.dataTransfer.setDragImage(pill, e.clientX - rect.left, e.clientY - rect.top);
        }
      }
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest<HTMLElement>(itemSelector);
    if (draggedPill && target && target !== draggedPill) {
      const rect = target.getBoundingClientRect();
      dropzoneElm.insertBefore(draggedPill, e.clientX < rect.left + rect.width / 2 ? target : target.nextSibling);
    }
  };

  const onDragEnd = () => {
    if (draggedPill) {
      const currentPill = draggedPill;
      if (draggingCssClass) {
        currentPill.classList.remove(draggingCssClass);
      }
      draggedPill = null;
      fallbackActive = false;
      options.onPillDragEnd?.(currentPill);
    }
  };

  // ── Column-header drop visual feedback & acceptance ───────────────────────

  const onDragEnter = (e: DragEvent) => {
    if (!draggedPill) {
      options.onColumnDragEnter?.(e);
    }
    e.preventDefault();
  };

  const onDragLeave = (e: DragEvent) => {
    if (!draggedPill) {
      options.onColumnDragLeave?.(e);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (!draggedPill) {
      const columnDataId = e.dataTransfer?.getData('text/plain');
      if (columnDataId) {
        options.onColumnDrop?.(columnDataId, e);
      }
    }
  };

  // Firefox/Linux native drag is broken; touch screens never fire HTML5 drag events.
  // Both cases share onPointerDown/Move/Up – coordinates come from a tiny helper.

  const onPointerDown = (e: MouseEvent | TouchEvent) => {
    const pill = (e.target as HTMLElement).closest<HTMLElement>(itemSelector);
    if (pill) {
      // Track start position for drag threshold
      dragStartX = getPointerPos(e).clientX;
      dragStartY = getPointerPos(e).clientY;
      draggedPill = pill;
      // Add visual feedback immediately for pills (no menu conflict)
      if (draggingCssClass) {
        pill.classList.add(draggingCssClass);
      }
      // Disable text selection during drag
      document.body.style.userSelect = 'none';
      if ('touches' in e) {
        document.addEventListener('touchmove', onPointerMove as EventListener, { passive: false });
        document.addEventListener('touchend', onPointerUp as EventListener);
        document.addEventListener('touchcancel', onPointerUp as EventListener);
      } else {
        document.addEventListener('mousemove', onPointerMove as EventListener);
        document.addEventListener('mouseup', onPointerUp as EventListener);
      }
    }
  };

  const onPointerMove = (e: MouseEvent | TouchEvent) => {
    if (draggedPill && dragStartX != null && dragStartY != null) {
      const { clientX, clientY } = getPointerPos(e);

      // Check if we've exceeded the drag threshold
      if (!fallbackActive) {
        const deltaX = Math.abs(clientX - dragStartX);
        const deltaY = Math.abs(clientY - dragStartY);
        if (deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD) {
          // Haven't moved far enough yet - don't commit to drag
          return;
        }
        // Threshold exceeded - now commit to drag by preventing default
        e.preventDefault();
        fallbackActive = true;
      }

      // Now handle the actual drag movement
      if (fallbackActive) {
        e.preventDefault();
        const target = (document.elementFromPoint(clientX, clientY) as HTMLElement | null)?.closest<HTMLElement>(itemSelector);
        if (target && target !== draggedPill && dropzoneElm.contains(target)) {
          const rect = target.getBoundingClientRect();
          const insertBefore = clientX < rect.left + rect.width / 2;
          const insertTarget = insertBefore ? target : target.nextSibling;
          if (draggedPill.parentElement === dropzoneElm && insertTarget !== draggedPill) {
            dropzoneElm.insertBefore(draggedPill, insertTarget);
          }
        }
      }
    }
  };

  const cleanupPointerListeners = () => {
    document.removeEventListener('mousemove', onPointerMove as EventListener);
    document.removeEventListener('mouseup', onPointerUp as EventListener);
    document.removeEventListener('touchmove', onPointerMove as EventListener);
    document.removeEventListener('touchend', onPointerUp as EventListener);
    document.removeEventListener('touchcancel', onPointerUp as EventListener);
  };

  const onPointerUp = () => {
    cleanupPointerListeners();
    const currentPill = draggedPill;
    if (currentPill && draggingCssClass) {
      currentPill.classList.remove(draggingCssClass);
    }
    draggedPill = null;
    dragStartX = null;
    dragStartY = null;
    fallbackActive = false;
    // Re-enable text selection after drag completes
    document.body.style.userSelect = '';
    if (currentPill) {
      options.onPillDragEnd?.(currentPill);
    }
  };

  // ── Register listeners ────────────────────────────────────────────────────

  dropzoneElm.addEventListener('dragstart', onDragStart as EventListener);
  dropzoneElm.addEventListener('dragover', onDragOver as EventListener);
  dropzoneElm.addEventListener('dragend', onDragEnd);
  dropzoneElm.addEventListener('dragenter', onDragEnter as EventListener);
  dropzoneElm.addEventListener('dragleave', onDragLeave as EventListener);
  dropzoneElm.addEventListener('drop', onDrop as EventListener);

  if (isFfLinux) {
    dropzoneElm.addEventListener('mousedown', onPointerDown as EventListener);
  }
  // Touch support for pill reordering (all platforms)
  dropzoneElm.addEventListener('touchstart', onPointerDown as EventListener, { passive: false });

  return {
    destroy() {
      dropzoneElm.removeEventListener('dragstart', onDragStart as EventListener);
      dropzoneElm.removeEventListener('dragover', onDragOver as EventListener);
      dropzoneElm.removeEventListener('dragend', onDragEnd);
      dropzoneElm.removeEventListener('dragenter', onDragEnter as EventListener);
      dropzoneElm.removeEventListener('dragleave', onDragLeave as EventListener);
      dropzoneElm.removeEventListener('drop', onDrop as EventListener);
      dropzoneElm.removeEventListener('touchstart', onPointerDown as EventListener);
      if (isFfLinux) {
        dropzoneElm.removeEventListener('mousedown', onPointerDown as EventListener);
      }
      cleanupPointerListeners();
      draggedPill = null;
      dragStartX = null;
      dragStartY = null;
      fallbackActive = false;
    },
  };
}
