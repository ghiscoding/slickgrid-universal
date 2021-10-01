import { Column, CompositeEditorOption, Editor, ElementPosition, } from './index';

/** A composite SlickGrid editor factory. */
export interface SlickCompositeEditor {
  /** Constructor of the Slick Composite Editor, it can optionally receive options */
  constructor: (columns: Column[], containers: Array<HTMLElement | JQuery<HTMLElement> | null>, options?: CompositeEditorOption) => void;

  getContainerBox(index: number): ElementPosition;

  editor: Partial<Editor>;
}
