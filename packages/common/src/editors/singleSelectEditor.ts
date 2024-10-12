import type { EditorArguments } from '../interfaces/editorArguments.interface.js';
import { SelectEditor } from './selectEditor.js';

export class SingleSelectEditor extends SelectEditor {
  /**
   * Initialize the Editor
   */
  constructor(protected readonly args: EditorArguments, public delayOpening = 0) {
    super(args, false, delayOpening);
  }
}
