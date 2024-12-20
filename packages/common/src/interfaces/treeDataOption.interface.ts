// import { Aggregator } from './aggregator.interface';
import type { SortDirection, SortDirectionString } from '../enums/index.js';
import type { Aggregator } from './aggregator.interface.js';
import type { Formatter } from './formatter.interface.js';

export interface TreeDataOption extends TreeDataPropNames {
  /** Tree Data Aggregators array that can be provided to aggregate the tree (avg, sum, ...) */
  aggregators?: Aggregator[];

  /** Defaults to 0, optional debounce to limit the number of recalc execution (when enabled) of Tree Totals (Aggregators), this is especially useful with large tree dataset. */
  autoRecalcTotalsDebounce?: number;

  /** Defaults to false, should we recalculate aggregator tree totals on a filter changed triggered */
  autoRecalcTotalsOnFilterChange?: boolean;

  /** Column Id of which column in the column definitions has the Tree Data, there can only be one with a Tree Data. */
  columnId: string;

  /**
   * Defaults to False, it will skip any other filter criteria(s) if the column holding the Tree passes its filter criteria (can only be used with `excludeChildrenWhenFilteringTree: false`, it has no effect otherwise)
   * In other words, if the current column is the column holding the Tree structure AND is a parent item which passes the filter criteria it will automatically be valid without inspecting any other filter criteria.
   */
  autoApproveParentItemWhenTreeColumnIsValid?: boolean;

  /**
   * Defaults to False, should we exclude the child item(s) when a parent matches the filter criteria?
   * by default (unless this feature is disabled) all child nodes of the tree will be included when a parent passes a filter and a group will be included if
   * 1) it has any children that passes the filter or
   * 2) current parent item passes the filter or
   * 3) current parent item filter is the Tree column and it passes that filter criteria regardless of other criteria (only works with `autoApproveParentItemWhenTreeColumnIsValid: true`)
   *    - even when the other columns don't pass the filter criteria, as use case described below
   *    - for example if we take the Example with File Explorer (live demo) and we filter (Files = "music" and Size > 7),
   *    - then the File "Music" will always show even if it doesn't have a Size because its tree column passes the filter (which was Files = "music")
   *    - and the reason we do this is that we'll be able to show music files with "Size > 7" even though these files might not include the word "music"
   */
  excludeChildrenWhenFilteringTree?: boolean;

  /** Optionally define the initial sort column and direction */
  initialSort?: {
    /** Column Id of the initial Sort */
    columnId: string;

    /** Direction of the initial Sort (ASC/DESC) */
    direction: SortDirection | SortDirectionString;
  };

  /** Defaults to False, will the Tree be collapsed on first load? */
  initiallyCollapsed?: boolean;

  /**
   * Defaults to 15px, margin to add from the left (calculated by the tree level multiplied by this number).
   * For example if tree depth level is 2, the calculation will be (2 * 15 = 30), so the column will be displayed 30px from the left
   */
  indentMarginLeft?: number;

  /**
   * Defaults to 5, indentation spaces to add from the left (calculated by the tree level multiplied by this number).
   * For example if tree depth level is 2, the calculation will be (2 * 15 = 30), so the column will be displayed 30px from the left
   */
  exportIndentMarginLeft?: number;

  /**
   * Defaults to centered dot (·), we added this because Excel seems to trim spaces leading character
   * and if we add a regular character like a dot then it keeps all tree level indentation spaces
   */
  exportIndentationLeadingChar?: string;

  /**
   * Defaults to 3, when using a collapsing icon then we need to add some extra spaces to compensate on parent level.
   * If you don't want collapsing icon in your export then you probably want to put this option at 0.
   */
  exportIndentationLeadingSpaceCount?: number;

  /** Optional Title Formatter (allows you to format/style the title text differently) */
  titleFormatter?: Formatter;
}

export interface TreeDataPropNames {
  /** Defaults to "children", object property name used to designate the Children array */
  childrenPropName?: string;

  /** Defaults to "__collapsed", object property name used to designate the Collapsed flag */
  collapsedPropName?: string;

  /** Defaults to "__hasChildren", object property name used to designate if the item has children or not (boolean) */
  hasChildrenPropName?: string;

  /**
   * Defaults to "id", object property name used to designate the Id field (you would rarely override this property, it is mostly used for internal usage).
   * NOTE: by default it will read the `datasetIdPropertyName` from the grid option, so it's typically better NOT to override this property.
   */
  identifierPropName?: string;

  /** Defaults to "__treeLevel", object property name used to designate the Tree Level depth number */
  levelPropName?: string;

  /** Defaults to "__parentId", object property name used to designate the Parent Id */
  parentPropName?: string;
}
