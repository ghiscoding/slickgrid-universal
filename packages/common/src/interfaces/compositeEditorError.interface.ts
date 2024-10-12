import type { Editor } from './editor.interface.js';

export interface CompositeEditorError {
  /** Editor DOM element container */
  container: HTMLElement | null;

  /** Editor associated to the container */
  editor: Editor;

  /** Editor index */
  index: number;

  /** Validation Error Message when any of the fields are invalid */
  msg: string | null;
}
