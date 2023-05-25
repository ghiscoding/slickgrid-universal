/** A base class that all specia / non-data rows (like Group and GroupTotals) derive from. */
export abstract class SlickNonDataItem {
  protected __nonDataRow = true;
}

export interface SlickGroup extends SlickNonDataItem {
  /**
   * Grouping level, starting with 0.
   * @type {Number}
   */
  level?: number;

  /***
   * Number of rows in the group.
   * @type {Integer}
   */
  count?: number;

  /***
   * Grouping value.
   * @type {Object}
   */
  value?: any;

  /***
   * Formatted display value of the group.
   * @type {String}
   */
  title?: string | null;

  /***
   * Whether a group is collapsed.
   * @type {Boolean}
   */
  collapsed?: boolean;

  /***
   * Whether a group selection checkbox is checked.
   * @type {Boolean}
   */
  selectChecked?: boolean;

  /***
   * GroupTotals, if any.
   * @type {GroupTotals}
   */
  totals?: any;

  /**
   * Rows that are part of the group.
   * @type {Array}
   */
  rows?: number[];

  /**
   * Sub-groups that are part of the group.
   * @type {Array}
   */
  groups?: any[];

  /**
   * A unique key used to identify the group.  This key can be used in calls to DataView
   * collapseGroup() or expandGroup().
   * @type {Object}
   */
  groupingKey?: string | null;
}

export interface GroupTotals extends SlickNonDataItem {
  /**
   * Parent Group
   * @type {Group}
   */
  group: SlickGroup;

  /**
   * Whether the totals have been fully initialized / calculated.
   * Will be set to false for lazy-calculated group totals.
   * @type {Boolean}
   */
  initialized: boolean;
}