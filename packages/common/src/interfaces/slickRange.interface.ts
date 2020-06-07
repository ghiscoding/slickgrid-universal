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

  /**
  * Returns whether a range contains a given cell.
  * @method contains
  * @param row {Integer}
  * @param cell {Integer}
  * @return {Boolean}
  */
  contains?: (row: number, cell: number) => boolean;

  /**
  * Returns whether a range represents a single cell.
  * @method isSingleCell
  * @return {Boolean}
  */
  isSingleCell?: () => boolean;

  /**
     * Returns whether a range represents a single row.
     * @method isSingleRow
     * @return {Boolean}
     */
  isSingleRow?: () => boolean;

  /**
  * Returns a readable representation of a range.
  * @method toString
  * @return {String}
  */
  toString?: () => string;
}
