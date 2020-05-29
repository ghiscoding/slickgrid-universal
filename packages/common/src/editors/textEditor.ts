import { KeyCode } from '../enums/keyCode.enum';
import { Column, ColumnEditor, Editor, EditorArguments, EditorValidator, EditorValidatorOutput, SlickGrid } from '../interfaces/index';
import { getDescendantProperty, setDeepValue } from '../services/utilities';
import { textValidator } from '../editorValidators/textValidator';

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class TextEditor implements Editor {
  private _lastInputKeyEvent: KeyboardEvent;
  private _input: HTMLInputElement;
  originalValue: string;

  /** SlickGrid Grid object */
  grid: SlickGrid;

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

  /** Get the Editor DOM Element */
  get editorDomElement(): any {
    return this._input;
  }

  get hasAutoCommitEdit() {
    return this.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init() {
    const columnId = this.columnDef && this.columnDef.id;
    const placeholder = this.columnEditor && this.columnEditor.placeholder || '';
    const title = this.columnEditor && this.columnEditor.title || '';

    this._input = document.createElement('input') as HTMLInputElement;
    this._input.className = `editor-text editor-${columnId}`;
    this._input.type = 'text';
    this._input.setAttribute('role', 'presentation');
    this._input.autocomplete = 'off';
    this._input.placeholder = placeholder;
    this._input.title = title;
    const cellContainer = this.args?.container;
    if (cellContainer && typeof cellContainer.appendChild === 'function') {
      cellContainer.appendChild(this._input);
    }

    this._input.onkeydown = ((event: KeyboardEvent) => {
      this._lastInputKeyEvent = event;
      if (event.keyCode === KeyCode.LEFT || event.keyCode === KeyCode.RIGHT) {
        event.stopImmediatePropagation();
      }
    });

    // the lib does not get the focus out event for some reason
    // so register it here
    if (this.hasAutoCommitEdit) {
      this._input.addEventListener('focusout', () => this.save());
    }

    setTimeout(() => this.focus(), 50);
  }

  destroy() {
    const columnId = this.columnDef && this.columnDef.id;
    const elm = document.querySelector(`.editor-text.editor-${columnId}`);
    if (elm) {
      elm.removeEventListener('focusout', () => { });
    }
  }

  focus(): void {
    this._input.focus();
  }

  getValue(): string {
    return this._input.value || '';
  }

  setValue(value: string) {
    this._input.value = value;
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
    const elmValue = this._input.value;
    const lastKeyEvent = this._lastInputKeyEvent && this._lastInputKeyEvent.keyCode;
    if (this.columnEditor && this.columnEditor.alwaysSaveOnEnterKey && lastKeyEvent === KeyCode.ENTER) {
      return true;
    }
    return (!(elmValue === '' && this.originalValue === null)) && (elmValue !== this.originalValue);
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    // is the field a complex object, "address.streetNumber"
    const isComplexObject = fieldName && fieldName.indexOf('.') > 0;

    if (item && fieldName !== undefined && this.columnDef && (item.hasOwnProperty(fieldName) || isComplexObject)) {
      const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : (item.hasOwnProperty(fieldName) && item[fieldName] || '');
      this.originalValue = value;
      this._input.value = this.originalValue;
      this._input.select();
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
    return this._input.value;
  }

  validate(inputValue?: any): EditorValidatorOutput {
    const elmValue = (inputValue !== undefined) ? inputValue : this._input && this._input.value;
    return textValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      required: this.columnEditor.required,
      validator: this.validator,
    });
  }
}
