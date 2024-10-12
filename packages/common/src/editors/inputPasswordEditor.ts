import type { EditorArguments } from '../interfaces/editorArguments.interface.js';
import { InputEditor } from './inputEditor.js';

export class InputPasswordEditor extends InputEditor {
  /** Initialize the Editor */
  constructor(protected readonly args: EditorArguments) {
    super(args, 'password');
  }
}
