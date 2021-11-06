import { SlickCellRangeDecorator } from '../extensions/slickCellRangeDecorator';

export interface CellRange {
  /** Selection start from which cell? */
  fromCell: number;

  /** Selection start from which row? */
  fromRow: number;

  /** Selection goes to which cell? */
  toCell: number;

  /** Selection goes to which row? */
  toRow: number;
}

export interface CellRangeDecoratorOption {
  selectionCssClass: string;
  selectionCss: CSSStyleDeclaration;
  offset: { top: number; left: number; height: number; width: number; };
}

export interface CellRangeSelectorOption {
  cellDecorator: SlickCellRangeDecorator;
  selectionCss: CSSStyleDeclaration;
}

export type CSSStyleDeclarationReadonly = 'length' | 'parentRule' | 'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty';
export type CSSStyleDeclarationWritable = keyof Omit<CSSStyleDeclaration, CSSStyleDeclarationReadonly>;
