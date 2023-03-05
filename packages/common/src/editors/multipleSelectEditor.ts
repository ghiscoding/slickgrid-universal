import { EditorArguments } from '../interfaces/editorArguments.interface';
import { SelectEditor } from './selectEditor';

export class MultipleSelectEditor extends SelectEditor {
  /**
   * Initialize the Editor
   */
  constructor(protected readonly args: EditorArguments, public delayOpening = -1) {
    super(args, true, delayOpening);
  }
}
