import type { EditorArguments } from '../interfaces/editorArguments.interface.js';
import { SelectEditor } from './selectEditor.js';

export class MultipleSelectEditor extends SelectEditor {
  /**
   * Initialize the Editor
   */
  constructor(protected readonly args: EditorArguments, public delayOpening = 0) {
    super(args, true, delayOpening);
  }
}
