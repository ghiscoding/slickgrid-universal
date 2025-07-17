import type { EditorArguments } from '../interfaces/editorArguments.interface.js';
import { SelectEditor } from './selectEditor.js';

export class MultipleSelectEditor extends SelectEditor {
  /**
   * Initialize the Editor
   */
  constructor(protected readonly args: EditorArguments) {
    super(args, true);
  }
}
