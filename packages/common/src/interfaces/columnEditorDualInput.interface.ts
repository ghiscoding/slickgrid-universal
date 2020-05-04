import { ColumnEditor } from './columnEditor.interface';

export interface EditorDualInput extends Partial<ColumnEditor> {
  /** Associated Item Field */
  field: string;

  /** Editor Type */
  type: 'integer' | 'float' | 'number' | 'password' | 'text' | 'readonly';
}

export interface ColumnEditorDualInput {
  leftInput: EditorDualInput;
  rightInput: EditorDualInput;
}
