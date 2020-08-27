import { Constants } from './../constants';
import { Column, ColumnEditor, CompositeEditorOption, Editor, EditorArguments, EditorValidator, EditorValidationResult, SlickGrid, SlickNamespace } from './../interfaces/index';
import { getDescendantProperty, setDeepValue } from '../services/utilities';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class CheckboxEditor implements Editor {
  private _input: HTMLInputElement;
  originalValue: boolean;

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
    return this.args.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init(): void {
    const columnId = this.columnDef && this.columnDef.id;
    const title = this.columnEditor && this.columnEditor.title || '';
    const compositeEditorOptions = this.args.compositeEditorOptions;

    const checkboxContainerElm = document.createElement('div');
    checkboxContainerElm.className = `checkbox-editor-container editor-${columnId}`;

    this._input = document.createElement('input');
    this._input.className = `editor-checkbox editor-${columnId}`;
    this._input.title = title;
    this._input.type = 'checkbox';
    this._input.value = 'true';

    const cellContainer = this.args?.container;
    if (cellContainer && typeof cellContainer.appendChild === 'function') {
      if (compositeEditorOptions) {
        checkboxContainerElm.appendChild(this._input);
        cellContainer.appendChild(checkboxContainerElm);
      } else {
        cellContainer.appendChild(this._input);
      }
    }

    // make the checkbox editor act like a regular checkbox that commit the value on click
    if (this.hasAutoCommitEdit && !compositeEditorOptions) {
      this._input.addEventListener('click', () => this.save());
    }

    if (compositeEditorOptions) {
      this._input.addEventListener('change', (event: KeyboardEvent) => this.handleChangeOnCompositeEditor(event, compositeEditorOptions));
    } else {
      this.focus();
    }
  }

  destroy() {
    const columnId = this.columnDef && this.columnDef.id;
    const elm = document.querySelector(`.editor-checkbox.editor-${columnId}`);
    if (elm) {
      elm.removeEventListener('click', this.save);
    }
  }

  focus(): void {
    this._input.focus();
  }

  getValue() {
    return this._input.checked;
  }

  setValue(val: boolean | string) {
    const isChecked = val ? true : false;
    this._input.checked = isChecked;
  }

  applyValue(item: any, state: any) {
    const fieldName = this.columnDef && this.columnDef.field;
    if (fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(null, state);
      const newValue = (validation && validation.valid) ? state : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        setDeepValue(item, fieldName, newValue);
      } else {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    return (this.serializeValue() !== this.originalValue);
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];

      this.originalValue = value;
      if (this.originalValue) {
        this._input.checked = true;
      } else {
        this._input.checked = false;
      }
    }
  }

  save() {
    const validation = this.validate();
    if (validation && validation.valid && this.isValueChanged() && this.hasAutoCommitEdit) {
      this.grid.getEditorLock().commitCurrentEdit();
    }
  }

  serializeValue(): boolean {
    return this._input.checked;
  }

  validate(_targetElm?: null, inputValue?: any): EditorValidationResult {
    const isRequired = this.args?.compositeEditorOptions ? false : this.columnEditor.required;
    const isChecked = (inputValue !== undefined) ? inputValue : this._input.checked;
    const errorMsg = this.columnEditor.errorMessage;

    if (this.validator) {
      return this.validator(isChecked, this.args);
    }

    // by default the editor is almost always valid (except when it's required but not provided)
    if (isRequired && !isChecked) {
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

  // --
  // private functions
  // ------------------

  private handleChangeOnCompositeEditor(event: Event, compositeEditorOptions: CompositeEditorOption) {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const item = this.args.item;
    const grid = this.grid;

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.args.item, this.serializeValue());
    }
    this.applyValue(compositeEditorOptions.formValues, this.serializeValue());
    grid.onCompositeEditorChange.notify({ ...activeCell, item, grid, column, formValues: compositeEditorOptions.formValues }, { ...new Slick.EventData(), ...event });
  }
}
