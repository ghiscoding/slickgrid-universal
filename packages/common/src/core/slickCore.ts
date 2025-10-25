/* eslint-disable object-shorthand */

/**
 * Contains core SlickGrid classes.
 * @module Core
 * @namespace Slick
 */
import type { MergeTypes } from '../enums/index.js';
import type { CSSStyleDeclarationWritable, DragRange, EditController, OnDragReplaceCellsEventArgs } from '../interfaces/index.js';
import type { SlickGrid } from './slickGrid.js';

export type Handler<ArgType = any> = (e: SlickEventData<ArgType>, args: ArgType) => void;

export interface BasePubSub {
  publish<ArgType = any>(_eventName: string | any, _data?: ArgType, delay?: number, assignEventCallback?: any): any;
  subscribe<ArgType = any>(_eventName: string | string[] | Function, _callback: (data: ArgType) => void): any;
}
interface PubSubPublishType<ArgType = any> {
  args: ArgType;
  eventData?: SlickEventData<ArgType>;
  nativeEvent?: Event;
}

/**
 * An event object for passing data to event handlers and letting them control propagation.
 * <p>This is pretty much identical to how W3C and jQuery implement events.</p>
 * @class EventData
 * @constructor
 */
export class SlickEventData<ArgType = any> {
  protected _arguments?: ArgType;
  protected _isPropagationStopped = false;
  protected _isImmediatePropagationStopped = false;
  protected _isDefaultPrevented = false;
  protected returnValue: any = undefined;
  protected _eventTarget?: EventTarget | null;
  nativeEvent?: Event | null;

  // public props that can be optionally pulled from the provided Event in constructor
  // they are all optional props because it really depends on the type of Event provided (KeyboardEvent, MouseEvent, ...)
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  readonly key?: string;
  readonly keyCode?: number;
  readonly clientX?: number;
  readonly clientY?: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
  readonly pageX?: number;
  readonly pageY?: number;
  readonly bubbles?: boolean;
  readonly target?: HTMLElement;
  readonly type?: string;
  readonly which?: number;
  readonly x?: number;
  readonly y?: number;

  get defaultPrevented(): boolean {
    return this._isDefaultPrevented;
  }

  constructor(
    protected event?: Event | null | undefined,
    protected args?: ArgType | undefined
  ) {
    this.nativeEvent = event;
    this._arguments = args;

    // when we already have an event, we want to keep some of the event properties
    // looping through some props is the only way to keep and sync these properties to the returned EventData
    if (event) {
      [
        'altKey',
        'ctrlKey',
        'metaKey',
        'shiftKey',
        'key',
        'keyCode',
        'clientX',
        'clientY',
        'offsetX',
        'offsetY',
        'pageX',
        'pageY',
        'bubbles',
        'target',
        'type',
        'which',
        'x',
        'y',
      ].forEach((key) => ((this as any)[key] = event[key as keyof Event]));
    }
    this._eventTarget = this.nativeEvent ? this.nativeEvent.target : undefined;
  }

  /**
   * Stops event from propagating up the DOM tree.
   * @method stopPropagation
   */
  stopPropagation(): void {
    this._isPropagationStopped = true;
    this.nativeEvent?.stopPropagation();
  }

  /**
   * Returns whether stopPropagation was called on this event object.
   * @method isPropagationStopped
   * @return {Boolean}
   */
  isPropagationStopped(): boolean {
    return this._isPropagationStopped;
  }

  /**
   * Prevents the rest of the handlers from being executed.
   * @method stopImmediatePropagation
   */
  stopImmediatePropagation(): void {
    this._isImmediatePropagationStopped = true;
    if (this.nativeEvent) {
      this.nativeEvent.stopImmediatePropagation();
    }
  }

  /**
   * Returns whether stopImmediatePropagation was called on this event object.\
   * @method isImmediatePropagationStopped
   * @return {Boolean}
   */
  isImmediatePropagationStopped(): boolean {
    return this._isImmediatePropagationStopped;
  }

  getNativeEvent<E extends Event>() {
    return this.nativeEvent as E;
  }

  preventDefault(): void {
    if (this.nativeEvent) {
      this.nativeEvent.preventDefault();
    }
    this._isDefaultPrevented = true;
  }

  isDefaultPrevented(): boolean {
    if (this.nativeEvent) {
      return this.nativeEvent.defaultPrevented;
    }
    return this._isDefaultPrevented;
  }

  addReturnValue(value: any): void {
    if (this.returnValue === undefined && value !== undefined) {
      this.returnValue = value;
    }
  }

  getReturnValue(): any {
    return this.returnValue;
  }

  getArguments(): ArgType | undefined {
    return this._arguments;
  }

  resetReturnValue(): void {
    this.returnValue = undefined;
  }
}

/**
 * A simple publisher-subscriber implementation.
 * @class Event
 * @constructor
 */
export class SlickEvent<ArgType = any> {
  protected _handlers: Handler<ArgType>[] = [];
  protected _pubSubService?: BasePubSub;

  get subscriberCount(): number {
    return this._handlers.length;
  }

  /**
   * Constructor
   * @param {String} [eventName] - event name that could be used for dispatching CustomEvent (when enabled)
   * @param {BasePubSub} [pubSubService] - event name that could be used for dispatching CustomEvent (when enabled)
   */
  constructor(
    protected readonly eventName?: string | undefined,
    protected readonly pubSub?: BasePubSub | undefined
  ) {
    this._pubSubService = pubSub;
  }

  /**
   * Adds an event handler to be called when the event is fired.
   * <p>Event handler will receive two arguments - an <code>EventData</code> and the <code>data</code>
   * object the event was fired with.<p>
   * @method subscribe
   * @param {Function} fn - Event handler.
   */
  subscribe(fn: Handler<ArgType>): void {
    this._handlers.push(fn);
  }

  /**
   * Removes an event handler added with <code>subscribe(fn)</code>.
   * @method unsubscribe
   * @param {Function} [fn] - Event handler to be removed.
   */
  unsubscribe(fn?: Handler<ArgType>): void {
    for (let i = this._handlers.length - 1; i >= 0; i--) {
      if (this._handlers[i] === fn) {
        this._handlers.splice(i, 1);
      }
    }
  }

  /**
   * Fires an event notifying all subscribers.
   * @method notify
   * @param {Object} args Additional data object to be passed to all handlers.
   * @param {EventData} [event] - An <code>EventData</code> object to be passed to all handlers.
   *      For DOM events, an existing W3C event object can be passed in.
   * @param {Object} [scope] - The scope ("this") within which the handler will be executed.
   *      If not specified, the scope will be set to the <code>Event</code> instance.
   */
  notify(
    args: ArgType,
    evt?: SlickEventData<ArgType> | Event | MergeTypes<SlickEventData, Event> | null,
    scope?: any,
    ignorePrevEventDataValue = false
  ): SlickEventData<ArgType> {
    const sed = evt instanceof SlickEventData ? evt : new SlickEventData<ArgType>(evt, args);
    if (ignorePrevEventDataValue) {
      sed.resetReturnValue();
    }
    scope = scope || this;

    for (let i = 0; i < this._handlers.length && !(sed.isPropagationStopped() || sed.isImmediatePropagationStopped()); i++) {
      const returnValue = this._handlers[i].call(scope, sed, args);
      sed.addReturnValue(returnValue);
    }

    // user can optionally add a global PubSub Service which makes it easy to publish/subscribe to events
    if (typeof this._pubSubService?.publish === 'function' && this.eventName) {
      const ret = this._pubSubService.publish<PubSubPublishType>(
        this.eventName,
        { args, eventData: sed },
        undefined,
        // assign the PubSub internal event to our SlickEventData.nativeEvent
        // so that we can call preventDefault() which would return a `returnValue = false`
        (evt: Event) => (sed.nativeEvent ??= evt)
      );
      sed.addReturnValue(ret);
    }
    return sed;
  }

  setPubSubService(pubSub: BasePubSub): void {
    this._pubSubService = pubSub;
  }
}

export class SlickEventHandler {
  protected handlers: Array<{ event: SlickEvent; handler: Handler<any> }> = [];

  get subscriberCount(): number {
    return this.handlers.length;
  }

  subscribe<T = any>(event: SlickEvent<T>, handler: Handler<T>): SlickEventHandler {
    this.handlers.push({ event, handler });
    event.subscribe(handler);

    return this as SlickEventHandler; // allow chaining
  }

  unsubscribe<T = any>(event: SlickEvent, handler: Handler<T>): SlickEventHandler | void {
    let i = this.handlers.length;
    while (i--) {
      if (this.handlers[i].event === event && this.handlers[i].handler === handler) {
        this.handlers.splice(i, 1);
        event.unsubscribe(handler);
        return;
      }
    }

    return this as SlickEventHandler; // allow chaining
  }

  unsubscribeAll(): SlickEventHandler {
    let i = this.handlers.length;
    while (i--) {
      this.handlers[i].event.unsubscribe(this.handlers[i].handler);
    }
    this.handlers = [];

    return this as SlickEventHandler; // allow chaining
  }
}

/**
 * A structure containing a range of cells.
 * @class Range
 * @constructor
 * @param fromRow {Integer} Starting row.
 * @param fromCell {Integer} Starting cell.
 * @param toRow {Integer} Optional. Ending row. Defaults to <code>fromRow</code>.
 * @param toCell {Integer} Optional. Ending cell. Defaults to <code>fromCell</code>.
 */
export class SlickRange {
  fromRow: number;
  fromCell: number;
  toCell: number;
  toRow: number;

  constructor(fromRow: number, fromCell: number, toRow?: number, toCell?: number) {
    if (toRow === undefined && toCell === undefined) {
      toRow = fromRow;
      toCell = fromCell;
    }

    /**
     * @property fromRow
     * @type {Integer}
     */
    this.fromRow = Math.min(fromRow, toRow as number);

    /**
     * @property fromCell
     * @type {Integer}
     */
    this.fromCell = Math.min(fromCell, toCell as number);

    /**
     * @property toRow
     * @type {Integer}
     */
    this.toRow = Math.max(fromRow, toRow as number);

    /**
     * @property toCell
     * @type {Integer}
     */
    this.toCell = Math.max(fromCell, toCell as number);
  }

  /**
   * Returns whether a range represents a single cell.
   * @method isSingleCell
   * @return {Boolean}
   */
  isSingleCell(): boolean {
    return this.fromRow === this.toRow && this.fromCell === this.toCell;
  }

  /**
   * Returns whether a range represents a single row.
   * @method isSingleRow
   * @return {Boolean}
   */
  isSingleRow(): boolean {
    return this.fromRow === this.toRow;
  }

  /**
   * Returns whether a range contains a given cell.
   * @method contains
   * @param row {Integer}
   * @param cell {Integer}
   * @return {Boolean}
   */
  contains(row: number, cell: number): boolean {
    return row >= this.fromRow && row <= this.toRow && cell >= this.fromCell && cell <= this.toCell;
  }

  /**
   * Row Count.
   * @method rowCount
   * @return {Number}
   */
  rowCount(): number {
    return this.toRow - this.fromRow + 1;
  }

  /**
   * Cell Count.
   * @method cellCount
   * @return {Number}
   */
  cellCount(): number {
    return this.toCell - this.fromCell + 1;
  }

  /**
   * Returns a readable representation of a range.
   * @method toString
   * @return {String}
   */
  toString(): string {
    if (this.isSingleCell()) {
      return `(${this.fromRow}:${this.fromCell})`;
    } else {
      return `(${this.fromRow}:${this.fromCell} - ${this.toRow}:${this.toCell})`;
    }
  }
}

/**
 * A structure containing a range of cells to copy to.
 * @class SlickCopyRange
 * @constructor
 * @param {Integer} fromRow Starting row.
 * @param {Integer} fromCell Starting cell.
 * @param {Integer} rowCount Row Count.
 * @param {Integer} cellCount Cell Count.
 */
export class SlickCopyRange {
  fromRow: number;
  fromCell: number;
  rowCount: number;
  cellCount: number;

  constructor(fromRow: number, fromCell: number, rowCount: number, cellCount: number) {
    this.fromRow = fromRow;
    this.fromCell = fromCell;
    this.rowCount = rowCount;
    this.cellCount = cellCount;
  }
}

/**
 * Create a handle element for Excel style drag-replace
 * @class DragExtendHandle
 * @constructor
 * @param gridUid {String} string UID of parent grid
 */
export class SlickDragExtendHandle {
  id: string;
  cssClass = 'slick-drag-replace-handle';

  constructor(gridUid: string) {
    this.id = gridUid + '_drag_replace_handle';
  }

  removeEl(): void {
    document.getElementById(this.id)?.remove();
  }

  createEl(activeCellNode: HTMLDivElement | null): void {
    if (activeCellNode) {
      const dragReplaceEl = document.createElement('div');
      dragReplaceEl.className = 'slick-drag-replace-handle';
      dragReplaceEl.setAttribute('id', this.id);
      activeCellNode.appendChild(dragReplaceEl);
    }
  }
}

/**
 * A base class that all special / non-data rows (like Group and GroupTotals) derive from.
 * @class NonDataItem
 * @constructor
 */
export class SlickNonDataItem {
  __nonDataRow = true;
}

/**
 * Information about a group of rows.
 * @class Group
 * @extends SlickNonDataItem
 * @constructor
 */
export class SlickGroup extends SlickNonDataItem {
  __group = true;

  /**
   * Grouping level, starting with 0.
   * @property level
   * @type {Number}
   */
  level = 0;

  /**
   * Number of rows in the group.
   * @property count
   * @type {Integer}
   */
  count = 0;

  /**
   * Grouping value.
   * @property value
   * @type {Object}
   */
  value: any = null;

  /**
   * Formatted display value of the group.
   * @property title
   * @type {String}
   */
  title: string | null = null;

  /**
   * Whether a group is collapsed.
   * @property collapsed
   * @type {Boolean}
   */
  collapsed: boolean | number = false;

  /**
   * Whether a group selection checkbox is checked.
   * @property selectChecked
   * @type {Boolean}
   */
  selectChecked = false;

  /**
   * GroupTotals, if any.
   * @property totals
   * @type {GroupTotals}
   */
  totals: SlickGroupTotals = null as any;

  /**
   * Rows that are part of the group.
   * @property rows
   * @type {Array}
   */
  rows: any[] = [];

  /**
   * Sub-groups that are part of the group.
   * @property groups
   * @type {Array}
   */
  groups: SlickGroup[] = null as any;

  /**
   * A unique key used to identify the group.
   * This key can be used in calls to DataView `collapseGroup()` or `expandGroup()`.
   * @property groupingKey
   * @type {String}
   */
  groupingKey = '';

  constructor() {
    super();
  }

  /**
   * Compares two Group instances.
   * @method equals
   * @return {Boolean}
   * @param group {Group} Group instance to compare to.
   */
  equals(group: SlickGroup): boolean {
    return this.value === group.value && this.count === group.count && this.collapsed === group.collapsed && this.title === group.title;
  }
}

/**
 * Information about group totals.
 * An instance of GroupTotals will be created for each totals row and passed to the aggregators
 * so that they can store arbitrary data in it.  That data can later be accessed by group totals
 * formatters during the display.
 * @class GroupTotals
 * @extends SlickNonDataItem
 * @constructor
 */
export class SlickGroupTotals extends SlickNonDataItem {
  __groupTotals = true;

  /**
   * Parent Group.
   * @param group
   * @type {Group}
   */
  group: SlickGroup | null = null; // pre-assign to null

  /**
   * Whether the totals have been fully initialized / calculated.
   * Will be set to false for lazy-calculated group totals.
   * @param initialized
   * @type {Boolean}
   */
  initialized = false;

  constructor() {
    super();
  }
}

/**
 * A locking helper to track the active edit controller and ensure that only a single controller
 * can be active at a time.  This prevents a whole class of state and validation synchronization
 * issues.  An edit controller (such as SlickGrid) can query if an active edit is in progress
 * and attempt a commit or cancel before proceeding.
 * @class EditorLock
 * @constructor
 */
export class SlickEditorLock {
  activeEditController: EditController | null = null;

  /**
   * Returns true if a specified edit controller is active (has the edit lock).
   * If the parameter is not specified, returns true if any edit controller is active.
   * @method isActive
   * @param editController {EditController}
   * @return {Boolean}
   */
  isActive(editController?: EditController): boolean {
    return editController ? this.activeEditController === editController : this.activeEditController !== null;
  }

  /**
   * Sets the specified edit controller as the active edit controller (acquire edit lock).
   * If another edit controller is already active, and exception will be throw new Error(.
   * @method activate
   * @param editController {EditController} edit controller acquiring the lock
   */
  activate(editController: EditController): void {
    if (editController === this.activeEditController) {
      // already activated?
      return;
    }
    if (this.activeEditController !== null) {
      throw new Error(`SlickEditorLock.activate: an editController is still active, can't activate another editController`);
    }
    if (!editController.commitCurrentEdit) {
      throw new Error('SlickEditorLock.activate: editController must implement .commitCurrentEdit()');
    }
    if (!editController.cancelCurrentEdit) {
      throw new Error('SlickEditorLock.activate: editController must implement .cancelCurrentEdit()');
    }
    this.activeEditController = editController;
  }

  /**
   * Unsets the specified edit controller as the active edit controller (release edit lock).
   * If the specified edit controller is not the active one, an exception will be throw new Error(.
   * @method deactivate
   * @param editController {EditController} edit controller releasing the lock
   */
  deactivate(editController: EditController): void {
    if (!this.activeEditController) {
      return;
    }
    if (this.activeEditController !== editController) {
      throw new Error('SlickEditorLock.deactivate: specified editController is not the currently active one');
    }
    this.activeEditController = null;
  }

  /**
   * Attempts to commit the current edit by calling "commitCurrentEdit" method on the active edit
   * controller and returns whether the commit attempt was successful (commit may fail due to validation
   * errors, etc.).  Edit controller's "commitCurrentEdit" must return true if the commit has succeeded
   * and false otherwise.  If no edit controller is active, returns true.
   * @method commitCurrentEdit
   * @return {Boolean}
   */
  commitCurrentEdit(): boolean {
    return this.activeEditController ? this.activeEditController.commitCurrentEdit() : true;
  }

  /**
   * Attempts to cancel the current edit by calling "cancelCurrentEdit" method on the active edit
   * controller and returns whether the edit was successfully cancelled.  If no edit controller is
   * active, returns true.
   * @method cancelCurrentEdit
   * @return {Boolean}
   */
  cancelCurrentEdit(): boolean {
    return this.activeEditController ? this.activeEditController.cancelCurrentEdit() : true;
  }
}

export class Utils {
  public static storage: {
    _storage: WeakMap<object, any>;
    put: (element: any, key: string, obj: any) => void;
    get: (element: any, key: string) => any;
    remove: (element: any, key: string) => any;
  } = {
    // https://stackoverflow.com/questions/29222027/vanilla-alternative-to-jquery-data-function-any-native-javascript-alternati
    _storage: new WeakMap(),
    put: function (element: any, key: string, obj: any): void {
      if (!this._storage.has(element)) {
        this._storage.set(element, new Map());
      }
      this._storage.get(element).set(key, obj);
    },
    get: function (element: any, key: string): any {
      const el = this._storage.get(element);
      if (el) {
        return el.get(key);
      }
      return null;
    },
    remove: function (element: any, key: string): any {
      const ret = this._storage.get(element).delete(key);
      if (!(this._storage.get(element).size === 0)) {
        this._storage.delete(element);
      }
      return ret;
    },
  };

  public static height(el: HTMLElement, value?: number | string): number | void {
    if (!el) {
      return;
    }
    if (value === undefined) {
      return el.getBoundingClientRect().height;
    }
    Utils.setStyleSize(el, 'height', value);
  }

  public static width(el: HTMLElement, value?: number | string): number | void {
    if (!el || !el.getBoundingClientRect) {
      return;
    }
    if (value === undefined) {
      return el.getBoundingClientRect().width;
    }
    Utils.setStyleSize(el, 'width', value);
  }

  public static setStyleSize(el: HTMLElement, style: string, val?: number | string | Function): void {
    if (typeof val === 'function') {
      val = val();
    }
    el.style[style as CSSStyleDeclarationWritable] = typeof val === 'string' ? val : `${val}px`;
  }

  public static isHidden(el: HTMLElement): boolean {
    return el.offsetWidth === 0 && el.offsetHeight === 0;
  }

  public static parents(el: HTMLElement | ParentNode, selector?: string): Array<HTMLElement | ParentNode> {
    const parents: Array<HTMLElement | ParentNode> = [];
    const visible = selector === ':visible';
    const hidden = selector === ':hidden';

    while ((el = el.parentNode as ParentNode) && el !== document) {
      if (!el || !el.parentNode) {
        break;
      }
      if (hidden) {
        if (Utils.isHidden(el as HTMLElement)) {
          parents.push(el);
        }
      } else if (visible) {
        if (!Utils.isHidden(el as HTMLElement)) {
          parents.push(el);
        }
      } else if (!selector || (el as any).matches(selector)) {
        parents.push(el);
      }
    }
    return parents;
  }

  public static toFloat(value: string | number): number {
    const x = parseFloat(value as string);
    if (isNaN(x)) {
      return 0;
    }
    return x;
  }

  public static show(el: HTMLElement | HTMLElement[], type = ''): void {
    if (Array.isArray(el)) {
      el.forEach((e) => (e.style.display = type));
    } else {
      el.style.display = type;
    }
  }

  public static hide(el: HTMLElement | HTMLElement[]): void {
    if (Array.isArray(el)) {
      el.forEach((e) => (e.style.display = 'none'));
    } else {
      el.style.display = 'none';
    }
  }

  public static applyDefaults(targetObj: any, srcObj: any): void {
    if (typeof srcObj === 'object') {
      Object.keys(srcObj).forEach((key) => {
        if (srcObj.hasOwnProperty(key) && !targetObj.hasOwnProperty(key)) {
          targetObj[key] = srcObj[key];
        }
      });
    }
  }

  /**
   * User could optionally add PubSub Service to SlickEvent
   * When it is defined then a SlickEvent `notify()` call will also dispatch it by using the PubSub publish() method
   * @param {BasePubSub} [pubSubService]
   * @param {*} scope
   */
  public static addSlickEventPubSubWhenDefined<T = any>(pubSub: BasePubSub, scope: T): void {
    if (pubSub) {
      for (const prop in scope) {
        if (scope[prop] instanceof SlickEvent && typeof (scope[prop] as SlickEvent).setPubSubService === 'function') {
          (scope[prop] as SlickEvent).setPubSubService(pubSub);
        }
      }
    }
  }
}

export class SlickSelectionUtils {
  //   |---0----|---1----|---2----|---3----|---4----|---5----|
  // 0 |        |        |        |     ^  |        |        |
  //   |--------|--------|--------|--------|--------|--------|
  // 1 |        |        |        |        |        |        |
  //   |--------|--------|--------|--------|--------|--------|
  // 2 |        |        |   1    |   2    |    > h |        |
  //   |--------|--------|--------|--------|--------|--------|
  // 3 |   <    |        |   4    |   5   x|    > h |    >   |
  //   |--------|--------|--------|--------|--------|--------|
  // 4 |        |        |    > v |    > v |    > v |        |
  //   |--------|--------|--------|--------|--------|--------|
  // 5 |        |        |        |    v   |        |        |
  //   |--------|--------|--------|--------|--------|--------|
  //
  // original range (1,2,4,5) expanded one cell to right and down
  //  '> h' indicates horizontal target copy area
  //  '> v' indicates vertical target copy area
  // note bottom right (corner) cell is considered part of vertical copy area

  public static normaliseDragRange(rawRange: DragRange): DragRange {
    // depending how the range is created (drag up/down) the start row/cell may be
    // greater or less thatn the end row/cell. Create a guaranteed left/down
    // progressive range (ie. start row/cell < end row/cell)

    const rtn: DragRange = {
      start: {
        row: (rawRange.end.row ?? 0) > (rawRange.start.row ?? 0) ? rawRange.start.row : rawRange.end.row,
        cell: (rawRange.end.cell ?? 0) > (rawRange.start.cell ?? 0) ? rawRange.start.cell : rawRange.end.cell,
      },
      end: {
        row: (rawRange.end.row ?? 0) > (rawRange.start.row ?? 0) ? rawRange.end.row : rawRange.start.row,
        cell: (rawRange.end.cell ?? 0) > (rawRange.start.cell ?? 0) ? rawRange.end.cell : rawRange.start.cell,
      },
    };
    rtn.rowCount = (rtn.end.row ?? 0) - (rtn.start.row ?? 0) + 1;
    rtn.cellCount = (rtn.end.cell ?? 0) - (rtn.start.cell ?? 0) + 1;

    rtn.wasDraggedUp = (rawRange.end.row ?? 0) < (rawRange.start.row ?? 0);
    rtn.wasDraggedLeft = (rawRange.end.row ?? 0) < (rawRange.start.row ?? 0);

    return rtn;
  }

  public static copyRangeIsLarger(baseRange: SlickRange, copyToRange: SlickRange): boolean {
    return (
      copyToRange.fromRow < baseRange.fromRow ||
      copyToRange.fromCell < baseRange.fromCell ||
      copyToRange.toRow > baseRange.toRow ||
      copyToRange.toCell > baseRange.toCell
    );
  }

  public static normalRangeOppositeCellFromCopy(
    normalisedDragRange: DragRange,
    targetCell: { row: number; cell: number }
  ): { row: number; cell: number } {
    const row = targetCell.row < (normalisedDragRange.end.row || 0) ? normalisedDragRange.end.row || 0 : normalisedDragRange.start.row || 0;
    const cell =
      targetCell.cell < (normalisedDragRange.end.cell || 0) ? normalisedDragRange.end.cell || 0 : normalisedDragRange.start.cell || 0;
    return { row: row, cell: cell };
  }

  // copy to range above or below - includes corner space target range
  public static verticalTargetRange(baseRange: SlickRange, copyToRange: SlickRange): SlickRange | null {
    const copyUp = copyToRange.fromRow < baseRange.fromRow;
    const copyDown = copyToRange.toRow > baseRange.toRow;
    if (!copyUp && !copyDown) {
      return null;
    }
    let rtn;
    if (copyUp) {
      rtn = new SlickRange(copyToRange.fromRow, copyToRange.fromCell, baseRange.fromRow - 1, copyToRange.toCell);
    } else {
      rtn = new SlickRange(baseRange.toRow + 1, copyToRange.fromCell, copyToRange.toRow, copyToRange.toCell);
    }
    return rtn;
  }

  // copy to range left or right - excludes corner space target range
  public static horizontalTargetRange(baseRange: SlickRange, copyToRange: SlickRange): SlickRange | null {
    const copyLeft = copyToRange.fromCell < baseRange.fromCell;
    const copyRight = copyToRange.toCell > baseRange.toCell;
    if (!copyLeft && !copyRight) {
      return null;
    }
    let rtn;
    if (copyLeft) {
      rtn = new SlickRange(baseRange.fromRow, copyToRange.fromCell, baseRange.toRow, baseRange.fromCell - 1);
    } else {
      rtn = new SlickRange(baseRange.fromRow, baseRange.toCell + 1, baseRange.toRow, copyToRange.toCell);
    }
    return rtn;
  }

  public static defaultCopyDraggedCellRange(_e: SlickEventData<any>, args: OnDragReplaceCellsEventArgs): void {
    const verticalTargetRange = SlickSelectionUtils.verticalTargetRange(args.prevSelectedRange, args.selectedRange);
    const horizontalTargetRange = SlickSelectionUtils.horizontalTargetRange(args.prevSelectedRange, args.selectedRange);

    if (verticalTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, verticalTargetRange, args.grid);
    }
    if (horizontalTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, horizontalTargetRange, args.grid);
    }
  }

  public static copyCellsToTargetRange(baseRange: SlickRange, targetRange: SlickRange, grid: SlickGrid): void {
    let fromRowOffset = 0,
      fromCellOffset = 0;
    const columns = grid.getVisibleColumns();
    const options = grid.getOptions();

    for (let i = 0; i < targetRange.rowCount(); i++) {
      const toRow = grid.getDataItem(targetRange.fromRow + i);
      const fromRow = grid.getDataItem(baseRange.fromRow + fromRowOffset);
      fromCellOffset = 0;

      for (let j = 0; j < targetRange.cellCount(); j++) {
        const toColDef = columns[targetRange.fromCell + j];
        const fromColDef = columns[baseRange.fromCell + fromCellOffset];

        if (!toColDef.hidden && !fromColDef.hidden) {
          let val = fromRow[fromColDef.field];
          if (options.dataItemColumnValueExtractor) {
            val = options.dataItemColumnValueExtractor(fromRow, fromColDef);
          }
          toRow[toColDef.field] = val;
        }

        fromCellOffset++;
        if (fromCellOffset >= baseRange.cellCount()) {
          fromCellOffset = 0;
        }
      }

      fromRowOffset++;
      if (fromRowOffset >= baseRange.rowCount()) {
        fromRowOffset = 0;
      }
    }
  }
}

export const SlickGlobalEditorLock: SlickEditorLock = new SlickEditorLock();
export const preClickClassName = 'slick-edit-preclick';
