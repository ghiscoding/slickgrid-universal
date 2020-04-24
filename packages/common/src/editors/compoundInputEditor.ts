import { Constants } from '../constants';
import { KeyCode } from '../enums/keyCode.enum';
import { Column, ColumnEditor, Editor, EditorArguments, EditorValidator, EditorValidatorOutput } from '../interfaces/index';
import { getDescendantProperty, setDeepValue } from '../services/utilities';

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class CompoundInputEditor implements Editor {
  protected _inputType = 'text';
  private _lastInputEvent: KeyboardEvent;
  private _leftInput: HTMLInputElement;
  private _rightInput: HTMLInputElement;
  originalLeftValue: string;
  originalRightValue: string;

  /** SlickGrid Grid object */
  grid: any;

  constructor(private args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column | undefined {
    return this.args && this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef && this.columnDef.internalColumnEditor || {};
  }

  /** Getter of input type (text, number, password) */
  get inputType() {
    return this._inputType;
  }

  /** Setter of input type (text, number, password) */
  set inputType(type: string) {
    this._inputType = type;
  }

  /** Get the Editor DOM Element */
  get editorDomElement(): { leftInput: HTMLInputElement, rightInput: HTMLInputElement } {
    return { leftInput: this._leftInput, rightInput: this._rightInput };
  }

  get hasAutoCommitEdit() {
    return this.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init() {
    const editorParams = this.columnEditor.params;
    if (!editorParams || !editorParams.leftField || !editorParams.rightField) {
      throw new Error(`[Slickgrid-Universal] Please make sure that your Compound Editor has params defined with "leftField" and "rightField" (example: { editor: { model: Editors.compound, params: { leftField: 'firstName', rightField: 'lastName' } }}`);
    }
    this._leftInput = this.createInput('left');
    this._rightInput = this.createInput('right');

    const cellContainer = this.args?.container;
    if (cellContainer && typeof cellContainer.appendChild === 'function') {
      cellContainer.appendChild(this._leftInput);
      cellContainer.appendChild(this._rightInput);
    }

    this._leftInput.onkeydown = ((event: KeyboardEvent) => {
      this._lastInputEvent = event;
      if (event.keyCode === KeyCode.LEFT || event.keyCode === KeyCode.RIGHT || event.keyCode === KeyCode.TAB) {
        event.stopImmediatePropagation();
      }
    });

    // the lib does not get the focus out event for some reason
    // so register it here
    if (this.hasAutoCommitEdit) {
      this._leftInput.addEventListener('focusout', () => this.save());
    }

    setTimeout(() => this.focus(), 50);
  }

  destroy() {
    const columnId = this.columnDef && this.columnDef.id;
    const elm = document.querySelector(`.compound-editor-text.editor-${columnId}`);
    if (elm) {
      elm.removeEventListener('focusout', () => { });
    }
  }

  createInput(position: 'left' | 'right'): HTMLInputElement {
    const columnId = this.columnDef && this.columnDef.id;
    const placeholder = this.columnEditor && this.columnEditor.placeholder || '';
    const title = this.columnEditor && this.columnEditor.title || '';
    const input = document.createElement('input') as HTMLInputElement;
    input.className = `compound-editor-text editor-${columnId} ${position}`;
    input.title = title;
    input.type = this._inputType || 'text';
    input.setAttribute('role', 'presentation');
    input.autocomplete = 'off';
    input.placeholder = placeholder;
    input.title = title;

    return input;
  }

  focus(): void {
    this._leftInput.focus();
  }

  getValue(): string {
    return this._leftInput.value || '';
  }

  setValue(value: string) {
    this._leftInput.value = value;
  }

  applyValue(item: any, state: any) {
    const fieldName = this.columnDef && this.columnDef.field;
    if (fieldName !== undefined) {
      const isComplexObject = fieldName && fieldName.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(state);
      const newValue = (validation && validation.valid) ? state : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        setDeepValue(item, fieldName, newValue);
      } else if (fieldName) {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._leftInput.value;
    const lastEvent = this._lastInputEvent && this._lastInputEvent.keyCode;
    if (this.columnEditor && this.columnEditor.alwaysSaveOnEnterKey && lastEvent === KeyCode.ENTER) {
      return true;
    }
    return (!(elmValue === '' && this.originalLeftValue === null)) && (elmValue !== this.originalLeftValue);
  }

  loadValue(item: any) {
    const leftFieldName = this.columnDef && this.columnDef.field;
    const rightFieldName = this.columnEditor.params?.rightField;

    // is the field a complex object, "address.streetNumber"
    const isComplexObject = leftFieldName && leftFieldName.indexOf('.') > 0;

    if (item && leftFieldName !== undefined && this.columnDef && (item.hasOwnProperty(leftFieldName) || isComplexObject)) {
      const leftValue = (isComplexObject) ? getDescendantProperty(item, leftFieldName) : (item.hasOwnProperty(leftFieldName) && item[leftFieldName] || '');
      this.originalLeftValue = leftValue;
      this._leftInput.value = this.originalLeftValue;
      this._leftInput.select();
    }

    if (item && rightFieldName !== undefined && this.columnDef && (item.hasOwnProperty(rightFieldName) || isComplexObject)) {
      const rightValue = (isComplexObject) ? getDescendantProperty(item, rightFieldName) : (item.hasOwnProperty(rightFieldName) && item[rightFieldName] || '');
      this.originalRightValue = rightValue;
      this._rightInput.value = this.originalRightValue;
    }
  }

  save() {
    const validation = this.validate();
    if (validation && validation.valid && this.isValueChanged()) {
      if (this.hasAutoCommitEdit) {
        this.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
    }
  }

  serializeValue() {
    return this._leftInput.value;
  }

  validate(inputValue?: any): EditorValidatorOutput {
    const isRequired = this.columnEditor.required;
    const elmValue = (inputValue !== undefined) ? inputValue : this._leftInput && this._leftInput.value;
    const errorMsg = this.columnEditor.errorMessage;

    if (this.validator) {
      return this.validator(elmValue, this.args);
    }

    // by default the editor is almost always valid (except when it's required but not provided)
    if (isRequired && elmValue === '') {
      return {
        valid: false,
        msg: errorMsg || Constants.VALIDATION_REQUIRED_FIELD
      };
    }

    return {
      valid: true,
      msg: null
    };
  }
}
