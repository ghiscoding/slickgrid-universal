import { ColumnEditor } from './columnEditor.interface';

interface EditorComboInput extends Partial<ColumnEditor> {
  /** Associated Item Field */
  field: string;

  /** Editor Type */
  type: 'integer' | 'float' | 'number' | 'password' | 'text' | 'readonly';
}

export interface ColumnEditorComboInput {
  leftInput: EditorComboInput;
  rightInput: EditorComboInput;
}
