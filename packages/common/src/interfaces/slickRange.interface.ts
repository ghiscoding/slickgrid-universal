import { CellRange } from './cellRange.interface';

export interface SlickRange extends CellRange {
  /**
   * A structure containing a range of cells.
   * @class Range
   * @constructor
   * @param fromRow {Integer} Starting row.
   * @param fromCell {Integer} Starting cell.
   * @param toRow {Integer} Optional. Ending row. Defaults to <code>fromRow</code>.
   * @param toCell {Integer} Optional. Ending cell. Defaults to <code>fromCell</code>.
   */
  constructor: (fromRow: number, fromCell: number, toRow: number, toCell: number) => void;

  /** Returns whether a range represents a single row. */
  isSingleRow?: () => boolean;

  /** Returns whether a range represents a single cell. */
  isSingleCell?: () => boolean;

  /** Returns whether a range contains a given cell. */
  contains?: (row: number, cell: number) => boolean;

  /** Returns a readable representation of a range. */
  toString?: () => string;
}
