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
  /**
   * Called when the drag is dropped onto an external dropzone such as draggable grouping.
   */
  onDrop?: (draggedEl: HTMLElement, event: DragEvent | MouseEvent, draggedColumnId?: string) => void;
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
  let fallbackActive = false;
  let originalParent: Node | null = null;
  let originalNextSibling: ChildNode | null = null;
  let dropzoneTargetActive = false;
  let draggedColumnId = '';
  let _lastClientX: number | null = null;
  let dragGhost: HTMLElement | null = null;

  const scrollColumnsRight = () => (viewportScrollContainerX.scrollLeft += 10);
  const scrollColumnsLeft = () => (viewportScrollContainerX.scrollLeft -= 10);
  const stopAutoScroll = () => {
    clearInterval(columnScrollTimer);
    columnScrollTimer = undefined;
  };

  const isDraggable = (el: HTMLElement): boolean =>
    el.classList.contains('slick-header-column') && (!unorderableColumnCssClass || !el.classList.contains(unorderableColumnCssClass));

  // Mirror SortableJS's Firefox/Linux fallback detection so the mouse-based path is used only for the broken browser combo.
  // Include Wayland because Firefox on Linux Wayland may omit the X11 token.
  const isFfLinux =
    typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent) && /(?:linux|wayland)/i.test(navigator.userAgent);

  const getColumnIds = (parent: HTMLElement): string[] =>
    Array.from(parent.children)
      .filter((el) => isDraggable(el as HTMLElement))
      .map((el) => (el as HTMLElement).dataset.id ?? '')
      .filter(Boolean);

  // Set draggable attribute on all eligible header columns
  const refreshDraggable = (parent: HTMLElement) => {
    Array.from(parent.children as HTMLCollectionOf<HTMLElement>).forEach((el) => {
      if (el.classList.contains('slick-header-column')) {
        // Disable native HTML5 drag on Firefox/Linux and use mouse fallback
        el.draggable = isDraggable(el) && !isFfLinux;
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

  const clearDropzoneTarget = () => {
    dropzoneTargetActive = false;
  };

  const clearFallbackGhost = () => {
    if (dragGhost?.parentElement) {
      dragGhost.parentElement.removeChild(dragGhost);
    }
    dragGhost = null;
  };

  const updateFallbackGhost = (clientX: number, clientY: number) => {
    if (!dragGhost) {
      return;
    }
    dragGhost.style.left = `${clientX}px`;
    dragGhost.style.top = `${clientY}px`;
  };

  const createFallbackGhost = (source: HTMLElement, clientX: number, clientY: number) => {
    clearFallbackGhost();
    dragGhost = source.cloneNode(true) as HTMLElement;
    dragGhost.classList.add('slick-header-column-drag-ghost');
    dragGhost.style.position = 'fixed';
    dragGhost.style.left = `${clientX}px`;
    dragGhost.style.top = `${clientY}px`;
    dragGhost.style.margin = '0';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.zIndex = '9999';
    dragGhost.style.transform = 'translate(-8px, -8px)';
    document.body.appendChild(dragGhost);
  };

  const onDropzoneDragEnter = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (draggedEl && target?.closest?.('.slick-dropzone')) {
      dropzoneTargetActive = true;
      // Ensure the dragged header remains in the header DOM (non-destructive)
      try {
        if (originalParent && draggedEl.parentElement !== originalParent) {
          originalParent.insertBefore(draggedEl, originalNextSibling as Node | null);
        }
      } catch (err) {
        // ignore
      }
    }
  };

  const onDropzoneDragLeave = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('.slick-dropzone')) {
      dropzoneTargetActive = false;
    }
  };

  const onDropzoneMouseOver = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (draggedEl && target?.closest?.('.slick-dropzone')) {
      dropzoneTargetActive = true;
      try {
        if (originalParent && draggedEl.parentElement !== originalParent) {
          originalParent.insertBefore(draggedEl, originalNextSibling as Node | null);
        }
      } catch (err) {
        // ignore
      }
    }
  };

  const onDropzoneMouseOut = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (target?.closest?.('.slick-dropzone') && !relatedTarget?.closest?.('.slick-dropzone')) {
      dropzoneTargetActive = false;
    }
  };

  document.addEventListener('dragenter', onDropzoneDragEnter as EventListener);
  document.addEventListener('dragleave', onDropzoneDragLeave as EventListener);
  document.addEventListener('mouseover', onDropzoneMouseOver as EventListener);
  document.addEventListener('mouseout', onDropzoneMouseOut as EventListener);

  const onDragStart = (e: DragEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('.slick-header-column');
    if (!target || !isDraggable(target)) {
      e.preventDefault();
      return;
    }
    draggedEl = target;
    draggedColumnId = target.dataset.id ?? '';
    clearDropzoneTarget();
    // remember original position so we can restore it if dropped outside headers (eg. dropzone)
    originalParent = target.parentElement;
    originalNextSibling = target.nextSibling;
    target.classList.add('slick-header-column-active');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // Store column id so the dropzone can identify which column was dragged
      if (typeof e.dataTransfer.setData === 'function') {
        e.dataTransfer.setData('text/plain', target.dataset.id ?? '');
      }
      // Explicit drag image avoids Firefox+Linux ghost rendering issues.
      // Use clientX/Y minus the target rect to get the offset relative to the
      // actual column header element (e.offsetX/Y is relative to e.target which
      // may be a child span, causing a wrong ghost position on Firefox/Linux).
      if (typeof e.dataTransfer.setDragImage === 'function') {
        const rect = target.getBoundingClientRect();
        e.dataTransfer.setDragImage(target, e.clientX - rect.left, e.clientY - rect.top);
      }
    }

    options.onDragStart?.(target);

    // reset pointer tracking for this drag session
    _lastClientX = e.clientX ?? null;

    // Only non-frozen columns should trigger browser-edge auto-scroll
    const canAutoScroll = !options.hasFrozenColumns() || headerRight.contains(target);
    if (canAutoScroll) {
      document.addEventListener('drag', autoScrollHandler as EventListener);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    const overDropzone = (e.target as HTMLElement | null)?.closest?.('.slick-dropzone');
    if (overDropzone) {
      dropzoneTargetActive = true;
      // Keep the dragged header visible in the original header DOM while over the dropzone
      try {
        if (originalParent && draggedEl && draggedEl.parentElement !== originalParent) {
          originalParent.insertBefore(draggedEl, originalNextSibling as Node | null);
        }
      } catch (err) {
        // ignore
      }
      return;
    }

    const target = (e.target as HTMLElement).closest<HTMLElement>('.slick-header-column');
    if (!draggedEl || !target || target === draggedEl || !isDraggable(target)) {
      return;
    }

    // Only reorder against actual header containers, never against pre-header content.
    const targetParent = target.parentElement;
    if (!targetParent || (!headerLeft.contains(targetParent) && !headerRight.contains(targetParent))) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const movingRight = _lastClientX == null ? e.clientX >= rect.left + rect.width / 2 : e.clientX > _lastClientX;
    _lastClientX = e.clientX;
    const insertBefore = !movingRight;
    target.parentElement!.insertBefore(draggedEl, insertBefore ? target : target.nextSibling);
  };

  const onDragEnd = (e: DragEvent) => {
    const draggedHeader = draggedEl;
    if (draggedHeader) {
      draggedHeader.classList.remove('slick-header-column-active');
    }
    stopAutoScroll();
    document.removeEventListener('drag', autoScrollHandler as EventListener);

    // If the drop happened over an external dropzone (eg. DraggableGrouping), the header
    // may have been moved out of the header DOM during dragover. Detect that and
    // restore the header to its original parent to avoid permanently removing the column
    // from the grid's column list when we read column order from the DOM.
    let droppedOnDropzone = dropzoneTargetActive;
    try {
      if (!droppedOnDropzone && e.clientX != null && e.clientY != null) {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (el && el.closest && el.closest('.slick-dropzone')) {
          droppedOnDropzone = true;
        }
      }
    } catch (err) {
      droppedOnDropzone = false;
    }

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
    draggedEl = null;
    originalParent = null;
    originalNextSibling = null;
    draggedColumnId = '';
    clearDropzoneTarget();
    fallbackActive = false;
    _lastClientX = null;
  };

  // Firefox on Linux has broken/unstable native HTML5 drag behavior in many setups.
  // Provide a mouse-based fallback that mimics SortableJS's `forceFallback`.
  const onFallbackMouseDown = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('.slick-header-column');
    if (!target || !isDraggable(target)) return;
    e.preventDefault();
    draggedEl = target;
    draggedColumnId = target.dataset.id ?? '';
    originalParent = target.parentElement;
    originalNextSibling = target.nextSibling;
    draggedEl.classList.add('slick-header-column-active');
    options.onDragStart?.(target);
    createFallbackGhost(target, e.clientX, e.clientY);
    fallbackActive = true;
    _lastClientX = e.clientX;
    document.addEventListener('mousemove', onFallbackMouseMove as EventListener);
    document.addEventListener('mouseup', onFallbackMouseUp as EventListener);
  };

  const onFallbackMouseMove = (e: MouseEvent) => {
    if (!fallbackActive || !draggedEl) return;
    updateFallbackGhost(e.clientX, e.clientY);
    const elUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const overDropzone = elUnder?.closest?.('.slick-dropzone');
    if (overDropzone) {
      dropzoneTargetActive = true;
      return;
    }
    dropzoneTargetActive = false;

    // If we're over another header column, perform the same live DOM reordering
    // that the native dragover handler does so users get immediate visual feedback.
    const targetHeader = elUnder?.closest?.('.slick-header-column') as HTMLElement | null;
    if (!targetHeader || targetHeader === draggedEl || !isDraggable(targetHeader)) return;

    const targetParent = targetHeader.parentElement;
    if (!targetParent || (!headerLeft.contains(targetParent) && !headerRight.contains(targetParent))) {
      return;
    }

    try {
      const rect = targetHeader.getBoundingClientRect();
      const movingRight = _lastClientX == null ? e.clientX >= rect.left + rect.width / 2 : e.clientX > _lastClientX;
      _lastClientX = e.clientX;
      const insertBefore = !movingRight;
      targetHeader.parentElement!.insertBefore(draggedEl, insertBefore ? targetHeader : targetHeader.nextSibling);
    } catch (err) {
      // ignore DOM insertion errors
    }
  };

  const onFallbackMouseUp = (e: MouseEvent) => {
    const draggedHeader = draggedEl;
    if (draggedHeader) {
      draggedHeader.classList.remove('slick-header-column-active');
    }
    fallbackActive = false;
    document.removeEventListener('mousemove', onFallbackMouseMove as EventListener);
    document.removeEventListener('mouseup', onFallbackMouseUp as EventListener);

    let droppedOnDropzone = dropzoneTargetActive;
    try {
      if (!droppedOnDropzone) {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (el && el.closest && el.closest('.slick-dropzone')) {
          droppedOnDropzone = true;
        }
      }
    } catch (err) {
      droppedOnDropzone = false;
    }
    // If the fallback drop landed on an external dropzone, ensure the
    // header DOM is restored to its original parent so the grid's column
    // list remains intact. This prevents Firefox/Linux from permanently
    // removing the header element when the dropzone interaction mutates the DOM.
    if (droppedOnDropzone && draggedHeader && originalParent) {
      try {
        originalParent.insertBefore(draggedHeader, originalNextSibling as Node | null);
      } catch (err) {
        // ignore restore failures
      }
    }
    const reorderedIds = getColumnIds(headerLeft).concat(getColumnIds(headerRight));
    if (droppedOnDropzone && draggedHeader) {
      options.onDrop?.(draggedHeader, e, draggedColumnId);
    } else {
      options.onDragEnd(reorderedIds);
    }
    draggedEl = null;
    originalParent = null;
    originalNextSibling = null;
    draggedColumnId = '';
    _lastClientX = null;
    clearDropzoneTarget();
    fallbackActive = false;
    clearFallbackGhost();
  };

  for (const parent of [headerLeft, headerRight]) {
    parent.addEventListener('dragstart', onDragStart as EventListener);
    parent.addEventListener('dragover', onDragOver as EventListener);
    parent.addEventListener('dragend', onDragEnd as EventListener);
    if (isFfLinux) {
      // Mouse-based fallback for Firefox on Linux
      parent.addEventListener('mousedown', onFallbackMouseDown as EventListener, true);
    }
  }

  return {
    destroy() {
      for (const parent of [headerLeft, headerRight]) {
        parent.removeEventListener('dragstart', onDragStart as EventListener);
        parent.removeEventListener('dragover', onDragOver as EventListener);
        parent.removeEventListener('dragend', onDragEnd as EventListener);
        if (isFfLinux) {
          parent.removeEventListener('mousedown', onFallbackMouseDown as EventListener, true);
        }
      }
      document.removeEventListener('drag', autoScrollHandler as EventListener);
      document.removeEventListener('mousemove', onFallbackMouseMove as EventListener);
      document.removeEventListener('mouseup', onFallbackMouseUp as EventListener);
      document.removeEventListener('dragenter', onDropzoneDragEnter as EventListener);
      document.removeEventListener('dragleave', onDropzoneDragLeave as EventListener);
      document.removeEventListener('mouseover', onDropzoneMouseOver as EventListener);
      document.removeEventListener('mouseout', onDropzoneMouseOut as EventListener);
      stopAutoScroll();
      draggedEl = null;
      originalParent = null;
      originalNextSibling = null;
      draggedColumnId = '';
      fallbackActive = false;
      clearDropzoneTarget();
      clearFallbackGhost();
      [headerLeft, headerRight].forEach((parent) =>
        Array.from(parent.querySelectorAll<HTMLElement>('.slick-header-column')).forEach((el) => {
          el.draggable = false;
          el.classList.remove('slick-header-column-active');
        })
      );
    },
  };
}
