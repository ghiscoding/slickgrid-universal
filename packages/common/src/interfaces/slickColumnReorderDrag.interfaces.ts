export interface ColumnReorderDragOption {
  /** CSS class applied to dragged header columns while drag is active */
  dragActiveClass?: string;
  /** CSS selector used to find draggable header items (default: `.slick-header-column`) */
  draggableSelector?: string;
  /** Header containers in DOM order; a column only moves within its own container */
  headers: HTMLElement[];
  /** Grid container – used for the right-edge auto-scroll boundary */
  container: HTMLElement;
  /** Scrollable viewport – used for the left-edge boundary and actual scrolling */
  viewportScrollContainerX: HTMLElement;
  /** Returns false when this column must not auto-scroll, e.g. a pinned column (default: true) */
  canAutoScroll?: (draggedEl: HTMLElement) => boolean;
  /** CSS class that marks a column as non-reorderable */
  unorderableColumnCssClass?: string;
  /** Dropzone selector used to detect external drop targets (default: `.slick-dropzone`) */
  dropzoneSelector?: string;
  /** CSS class toggled while hovering an external dropzone (default: `slick-dropzone-hover`) */
  dropzoneHoverClass?: string;
  /**
   * Generic filter to ignore drag starts from interactive descendants.
   * - `string`: CSS selector used with `closest()`
   * - `function`: return `true` to cancel drag start for this target
   */
  dragStartFilter?: string | ((target: HTMLElement | null, event: DragEvent | MouseEvent | TouchEvent) => boolean);
  /**
   * Called right after dragstart, before any DOM changes.
   * Use this to snapshot column state that your onDragEnd callback needs.
   */
  onDragStart?: (draggedEl: HTMLElement) => void;
  /**
   * Called with the reorderable header IDs after the drag and their order when the drag started.
   * Pass both lists to `reconcileColumnOrder()` to preserve each column's original slot.
   * Responsible for applying the reorder (setColumns, triggerEvent, etc.).
   */
  onDragEnd: (reorderedIds: string[], originalIds: string[]) => void;
  /**
   * Called when the drag is dropped onto an external dropzone such as draggable grouping.
   */
  onDrop?: (draggedEl: HTMLElement, event: DragEvent | MouseEvent | TouchEvent, draggedColumnId?: string) => void;
}

/** Dropzone pill drag (used by DraggableGrouping to reorder group pills) */
export interface DropzonePillDragOption {
  /** The dropzone container element */
  dropzoneElm: HTMLElement;
  /** CSS selector for draggable pill elements inside the dropzone (default: `.slick-dropped-grouping`) */
  itemSelector?: string;
  /** CSS class added to a pill while it is being dragged via the mouse fallback */
  draggingCssClass?: string;
  /** Called when a pill reorder drag-and-drop is complete */
  onPillDragEnd?: (pill: HTMLElement) => void;
  /** Called when an external drag (e.g. column header) enters the dropzone */
  onColumnDragEnter?: (e: DragEvent) => void;
  /** Called when an external drag leaves the dropzone */
  onColumnDragLeave?: (e: DragEvent) => void;
  /** Called when a column header is natively dropped onto the dropzone */
  onColumnDrop?: (columnDataId: string, e: DragEvent) => void;
}
