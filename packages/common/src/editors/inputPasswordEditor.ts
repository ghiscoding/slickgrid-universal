import type { EditorArguments } from '../interfaces/editorArguments.interface';
import { InputEditor } from './inputEditor';

export class InputPasswordEditor extends InputEditor {
  /** Initialize the Editor */
  constructor(protected readonly args: EditorArguments) {
    super(args, 'password');
  }
}
