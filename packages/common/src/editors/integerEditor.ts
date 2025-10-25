import { integerValidator } from '../editorValidators/integerValidator.js';
import type { EditorArguments, EditorValidationResult, ValidateOption } from '../interfaces/index.js';
import { getDescendantProperty } from '../services/utilities.js';
import { InputEditor } from './inputEditor.js';

export class IntegerEditor extends InputEditor {
  constructor(protected readonly args: EditorArguments) {
    super(args, 'number');
  }

  loadValue(item: any): void {
    const fieldName = this.columnDef?.field;

    if (item && fieldName !== undefined && this._input) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;

      const value = isComplexObject ? getDescendantProperty(item, fieldName) : item[fieldName];
      this._originalValue = isNaN(value) || value === null || value === undefined ? value : `${value}`;
      this._input.value = `${this._originalValue}`;
      this._input.select();
    }
  }

  serializeValue(): string | number {
    const elmValue = this._input?.value;
    if (elmValue === undefined || elmValue === '' || isNaN(+elmValue)) {
      return elmValue as string;
    }
    const output = isNaN(+elmValue) ? elmValue : parseInt(elmValue, 10);
    return isNaN(+output) ? elmValue : output;
  }

  validate(_targetElm?: any, options?: ValidateOption): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.isCompositeEditor) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    const elmValue = options?.inputValue ?? this.getValue();
    return integerValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      minValue: this.columnEditor.minValue,
      maxValue: this.columnEditor.maxValue,
      operatorConditionalType: this.columnEditor.operatorConditionalType,
      required: this.args.isCompositeEditor ? false : this.columnEditor.required,
      validator: this.validator,
    });
  }

  // --
  // protected functions
  // ------------------

  /** When the input value changes (this will cover the input spinner arrows on the right) */
  protected handleOnMouseWheel(event: KeyboardEvent): void {
    this._isValueTouched = true;
    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions) {
      this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
    }
  }
}
