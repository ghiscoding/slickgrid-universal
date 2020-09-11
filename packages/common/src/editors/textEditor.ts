import { KeyCode } from '../enums/keyCode.enum';
import { Column, ColumnEditor, CompositeEditorOption, Editor, EditorArguments, EditorValidator, EditorValidationResult, GridOption, SlickGrid, SlickNamespace, } from '../interfaces/index';
import { debounce, getDescendantProperty, setDeepValue } from '../services/utilities';
import { textValidator } from '../editorValidators/textValidator';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class TextEditor implements Editor {
  private _lastInputKeyEvent: KeyboardEvent;
  private _input: HTMLInputElement;
  private _isDisabled = false;
  private _originalValue: string;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Grid options */
  gridOptions: GridOption;

  constructor(private args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.gridOptions = args.grid && args.grid.getOptions() as GridOption;
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

  /** Getter for the Editor DOM Element */
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
    const compositeEditorOptions = this.args.compositeEditorOptions;

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

    this._input.onfocus = () => this._input.select();
    this._input.onkeydown = ((event: KeyboardEvent) => {
      this._lastInputKeyEvent = event;
      if (event.keyCode === KeyCode.LEFT || event.keyCode === KeyCode.RIGHT) {
        event.stopImmediatePropagation();
      }
    });

    // the lib does not get the focus out event for some reason
    // so register it here
    if (this.hasAutoCommitEdit && !compositeEditorOptions) {
      this._input.addEventListener('focusout', () => this.save());
    }

    if (compositeEditorOptions) {
      this._input.addEventListener('keyup', this.handleOnKeyUp.bind(this));
    }
  }

  destroy() {
    if (this._input) {
      this._input.removeEventListener('focusout', this.save);
      this._input.removeEventListener('keyup', this.handleOnKeyUp);
      setTimeout(() => this._input.remove());
    }
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this._isDisabled;
    this._isDisabled = isDisabled;

    if (this._input) {
      if (isDisabled) {
        this._input.setAttribute('disabled', 'disabled');

        // clear the checkbox when it's newly disabled
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions) {
          this._originalValue = '';
          this._input.value = '';
          this.handleChangeOnCompositeEditor(null, this.args.compositeEditorOptions);
        }
      } else {
        this._input.removeAttribute('disabled');
      }
    }
  }

  focus(): void {
    this._input.focus();
  }

  show() {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
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
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(null, state);
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
    return (!(elmValue === '' && (this._originalValue === null || this._originalValue === undefined))) && (elmValue !== this._originalValue);
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : (item.hasOwnProperty(fieldName) && item[fieldName] || '');

      this._originalValue = value;
      this._input.value = this._originalValue;
      this._input.select();
    }
  }

  save() {
    const validation = this.validate();
    const isValid = (validation && validation.valid) || false;

    if (this.hasAutoCommitEdit && isValid) {
      // do not use args.commitChanges() as this sets the focus to the next row.
      // also the select list will stay shown when clicking off the grid
      this.grid.getEditorLock().commitCurrentEdit();
    } else {
      this.args.commitChanges();
    }
  }

  serializeValue() {
    return this._input.value;
  }

  validate(_targetElm?: null, inputValue?: any): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this._isDisabled) {
      return { valid: true, msg: '' };
    }

    const elmValue = (inputValue !== undefined) ? inputValue : this._input && this._input.value;
    return textValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      minLength: this.columnEditor.minLength,
      maxLength: this.columnEditor.maxLength,
      operatorConditionalType: this.columnEditor.operatorConditionalType,
      required: this.args?.compositeEditorOptions ? false : this.columnEditor.required,
      validator: this.validator,
    });
  }

  // --
  // private functions
  // ------------------

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  private applyInputUsabilityState() {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell.notify({ ...activeCell, item: this.args.item, column: this.args.column, grid: this.grid });
    this.disable(isCellEditable === false);
  }

  private handleChangeOnCompositeEditor(event: Event | null, compositeEditorOptions: CompositeEditorOption) {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const columnId = this.columnDef?.id ?? '';
    const item = this.args.item;
    const grid = this.grid;

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.args.item, this.serializeValue());
    }
    this.applyValue(compositeEditorOptions.formValues, this.serializeValue());
    if (this._isDisabled && compositeEditorOptions.formValues.hasOwnProperty(columnId)) {
      delete compositeEditorOptions.formValues[columnId]; // when the input is disabled we won't include it in the form result object
    }
    grid.onCompositeEditorChange.notify({ ...activeCell, item, grid, column, formValues: compositeEditorOptions.formValues }, { ...new Slick.EventData(), ...event });
  }

  private handleOnKeyUp(event: KeyboardEvent) {
    const compositeEditorOptions = this.args.compositeEditorOptions;
    const typingDelay = this.gridOptions?.editorTypingDebounce ?? 500;
    debounce(() => this.handleChangeOnCompositeEditor(event, compositeEditorOptions), typingDelay)();
  }
}
