import { CompositeEditorError } from './compositeEditorError.interface';

export interface EditorValidatorOutput {
  /** Did the validation pass? */
  valid: boolean;

  /** Validation Error Message when field is invalid */
  msg?: string | null;

  /** Errors property is populated only when using a Composite Editor */
  errors?: CompositeEditorError[];
}
