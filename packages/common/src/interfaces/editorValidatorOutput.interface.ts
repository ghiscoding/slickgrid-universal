import { Editor } from './editor.interface';

export interface EditorValidatorOutput {
  /** Did the validation pass? */
  valid: boolean;

  /** Validation Error Message when field is invalid */
  msg?: string | null;

  /** Errors property is populated only when using a Composite Editor */
  errors?: {
    container: HTMLElement;
    editor: Editor;
    index: number;
    msg: string;
  }[];
}
