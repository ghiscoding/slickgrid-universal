import type { EditorArguments, EditorValidationResult } from '../interfaces/index.js';
import { floatValidator } from '../editorValidators/floatValidator.js';
import { InputEditor } from './inputEditor.js';
import { getDescendantProperty } from '../services/utilities.js';

export class FloatEditor extends InputEditor {
  constructor(protected readonly args: EditorArguments) {
    super(args, 'number');
  }

  loadValue(item: any): void {
    const fieldName = this.columnDef?.field;

    if (fieldName !== undefined) {

      if (item && fieldName !== undefined && this._input) {
        // is the field a complex object, "address.streetNumber"
        const isComplexObject = fieldName?.indexOf('.') > 0;
        const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];

        this._originalValue = value;
        const decPlaces = this.getDecimalPlaces();
        if (decPlaces !== null && (this._originalValue || this._originalValue === 0) && this._originalValue !== undefined) {
          this._originalValue = (+this._originalValue).toFixed(decPlaces);
        }
        this._input.value = `${this._originalValue}`;
        this._input.select();
      }
    }
  }

  serializeValue(): string | number {
    const elmValue = this._input?.value;
    if (elmValue === undefined || elmValue === '' || isNaN(+elmValue)) {
      return elmValue as string;
    }

    let rtn = parseFloat(elmValue);
    const decPlaces = this.getDecimalPlaces();
    if (decPlaces !== null && (rtn || rtn === 0) && rtn.toFixed) {
      rtn = parseFloat(rtn.toFixed(decPlaces));
    }

    return rtn;
  }

  validate(_targetElm?: any, inputValue?: any): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    const elmValue = (inputValue !== undefined) ? inputValue : this._input?.value;
    return floatValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      decimal: this.getDecimalPlaces(),
      minValue: this.columnEditor.minValue,
      maxValue: this.columnEditor.maxValue,
      operatorConditionalType: this.columnEditor.operatorConditionalType,
      required: this.args?.compositeEditorOptions ? false : this.columnEditor.required,
      validator: this.validator,
    });
  }
}