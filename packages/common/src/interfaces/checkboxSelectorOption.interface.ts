import { UsabilityOverrideFn } from '../enums/usabilityOverrideFn.type';

export interface CheckboxSelectorOption {
  /** Defaults to "_checkbox_selector", you can provide a different column id used as the column header id */
  columnId?: string;

  /** Defaults to "sel", you can provide a different column field id used as the column header id */
  field?: string;

  /**
   * Defaults to 0, the column index position in the grid by default it will show as the first column (index 0).
   * Also note that the index position might vary if you use other extensions, after each extension is created,
   * it will add an offset to take into consideration (1.CheckboxSelector, 2.RowDetail, 3.RowMove)
   */
  columnIndexPosition?: number;

  /** Provide a CSS class used by each row selection check boxes */
  cssClass?: string;

  /** default to false, do we want to hide the "Select All" checkbox? */
  hideSelectAllCheckbox?: boolean;

  /** defaults to false, do we want to hide the "Select All" checkbox from the Column Header Title Row? */
  hideInColumnTitleRow?: boolean;

  /** defaults to true, do we want to hide the "Select All" checkbox from the Column Header Filter Row? */
  hideInFilterHeaderRow?: boolean;

  /** Defaults to "Select/Deselect All", provide a tooltip that will be shown over the "Select All" checkbox */
  toolTip?: string;

  /** Defaults to 30, width of the Row Selection checkbox column */
  width?: number;

  /** Override the logic for showing (or not) the expand icon (use case example: only every 2nd row is expandable) */
  selectableOverride?: UsabilityOverrideFn;

  /** Optional callback method to be executed when the row checkbox gets clicked but prior to the actual toggling itself. */
  onRowToggleStart?: (e: Event | null, args: { row: number; previousSelectedRows: number[]; }) => void;

  /** Optional callback method to be executed after the row checkbox toggle is completed. */
  onRowToggleEnd?: (e: Event | null, args: { row: number; previousSelectedRows: number[]; }) => void;

  /**
   * Optional callback method to be executed when the "Select All" gets clicked but prior to the actual toggling itself.
   * For example we could expand all Groups or Tree prior to the selection so that we also have the chance to even include Group/Tree children in the selection.
   */
  onSelectAllToggleStart?: (e: Event | null, args: { previousSelectedRows: number[]; caller: 'click.selectAll' | 'click.unselectAll'; }) => void;

  /** Optional callback method to be executed when the "Select All" toggled action is completed. */
  onSelectAllToggleEnd?: (e: Event | null, args: { rows: number[]; previousSelectedRows: number[]; caller: 'click.selectAll' | 'click.unselectAll'; }) => void;
}
