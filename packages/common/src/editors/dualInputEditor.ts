import { KeyCode } from '../enums/keyCode.enum';
import { getDescendantProperty, setDeepValue } from '../services/utilities';
import { floatValidator, integerValidator, textValidator } from '../editorValidators';
import {
  Column,
  ColumnEditor,
  ColumnEditorComboInput,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidatorOutput,
  SlickEventHandler
} from '../interfaces/index';

// using external non-typed js libraries
declare const Slick: any;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class DualInputEditor implements Editor {
  private _eventHandler: SlickEventHandler;
  private _isValueSaveCalled = false;
  private _lastEventType: string | undefined;
  private _lastInputKeyEvent: KeyboardEvent;
  private _leftInput: HTMLInputElement;
  private _rightInput: HTMLInputElement;
  private _leftFieldName: string;
  private _rightFieldName: string;
  originalLeftValue: string | number;
  originalRightValue: string | number;

  /** SlickGrid Grid object */
  grid: any;

  constructor(private args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.init();
    this._eventHandler = new Slick.EventHandler();
    this._eventHandler.subscribe(this.grid.onValidationError, () => this._isValueSaveCalled = true);
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
  get editorDomElement(): { leftInput: HTMLInputElement, rightInput: HTMLInputElement } {
    return { leftInput: this._leftInput, rightInput: this._rightInput };
  }

  get editorParams(): ColumnEditorComboInput {
    return this.columnEditor.params || {};
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get hasAutoCommitEdit() {
    return this.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init() {
    if (!this.editorParams || !this.editorParams.leftInput || !this.editorParams.leftInput.field || !this.editorParams.rightInput || !this.editorParams.rightInput.field) {
      throw new Error(`[Slickgrid-Universal] Please make sure that your Combo Input Editor has params defined with "leftInput" and "rightInput" (example: { editor: { model: Editors.comboInput, params: { leftInput: { field: 'firstName' }, { rightSide: { field: 'lastName' } }}}`);
    }
    this._leftFieldName = this.editorParams.leftInput?.field;
    this._rightFieldName = this.editorParams.rightInput?.field;
    this._leftInput = this.createInput('leftInput');
    this._rightInput = this.createInput('rightInput');

    const containerElm = this.args?.container;
    if (containerElm && typeof containerElm.appendChild === 'function') {
      containerElm.appendChild(this._leftInput);
      containerElm.appendChild(this._rightInput);
    }

    this._leftInput.onkeydown = this.handleKeyDown;
    this._rightInput.onkeydown = this.handleKeyDown;

    // the lib does not get the focus out event for some reason, so register it here
    if (this.hasAutoCommitEdit) {
      this._leftInput.addEventListener('focusout', (event: any) => this.handleFocusOut(event, 'leftInput'));
      this._rightInput.addEventListener('focusout', (event: any) => this.handleFocusOut(event, 'rightInput'));
    }

    setTimeout(() => this._leftInput.select(), 50);
  }

  handleFocusOut(event: any, position: 'leftInput' | 'rightInput') {
    // when clicking outside the editable cell OR when focusing out of it
    const targetClassNames = event.relatedTarget?.className || '';
    if (targetClassNames.indexOf('compound-editor') === -1 && this._lastEventType !== 'focusout-right') {
      if (position === 'rightInput' || (position === 'leftInput' && this._lastEventType !== 'focusout-left')) {
        this.save();
      }
    }
    const side = (position === 'leftInput') ? 'left' : 'right';
    this._lastEventType = `${event?.type}-${side}`;
  }

  handleKeyDown(event: KeyboardEvent) {
    this._lastInputKeyEvent = event;
    if (event.keyCode === KeyCode.LEFT || event.keyCode === KeyCode.RIGHT || event.keyCode === KeyCode.TAB) {
      event.stopImmediatePropagation();
    }
  }

  destroy() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    const columnId = this.columnDef && this.columnDef.id;
    const elm = document.querySelector(`.compound-editor-text.editor-${columnId}`);
    if (elm) {
      this._leftInput.removeEventListener('focusout', () => { });
      this._rightInput.removeEventListener('focusout', () => { });
    }
  }

  createInput(position: 'leftInput' | 'rightInput'): HTMLInputElement {
    const editorSideParams = this.editorParams[position];
    const columnId = this.columnDef && this.columnDef.id;
    const itemId = this.args?.item?.id || 0;

    let fieldType = editorSideParams.type || 'text';
    if (fieldType === 'float' || fieldType === 'integer') {
      fieldType = 'number';
    }

    const input = document.createElement('input') as HTMLInputElement;
    input.id = `item-${itemId}`;
    input.className = `compound-editor-text editor-${columnId} ${position.replace(/input/gi, '')}`;
    input.type = fieldType || 'text';
    input.setAttribute('role', 'presentation');
    input.autocomplete = 'off';
    input.placeholder = editorSideParams.placeholder || '';
    input.title = editorSideParams.title || '';
    if (fieldType === 'number') {
      input.step = this.getInputDecimalSteps(position);
    }
    return input;
  }

  focus() {
    // do nothing since we have 2 inputs and we might focus on left/right depending on which is invalid or new
  }

  getValue(): string {
    return this._leftInput.value || '';
  }

  setValue(value: string) {
    this._leftInput.value = value;
  }

  applyValue(item: any, state: any) {
    this.applyValueByPosition(item, state, 'leftInput');
    this.applyValueByPosition(item, state, 'rightInput');
  }

  applyValueByPosition(item: any, state: any, position: 'leftInput' | 'rightInput') {
    const fieldName = position === 'leftInput' ? this._leftFieldName : this._rightFieldName;
    if (fieldName !== undefined) {
      const isComplexObject = fieldName && fieldName.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate();
      const newValue = (validation && validation.valid) ? state[fieldName] : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        setDeepValue(item, fieldName, newValue);
      } else if (fieldName) {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const leftElmValue = this._leftInput.value;
    const rightElmValue = this._rightInput.value;
    const lastKeyEvent = this._lastInputKeyEvent && this._lastInputKeyEvent.keyCode;
    if (this.columnEditor && this.columnEditor.alwaysSaveOnEnterKey && lastKeyEvent === KeyCode.ENTER) {
      return true;
    }
    const leftResult = (!(leftElmValue === '' && this.originalLeftValue === null)) && (leftElmValue !== this.originalLeftValue);
    const rightResult = (!(rightElmValue === '' && this.originalRightValue === null)) && (rightElmValue !== this.originalRightValue);
    return leftResult || rightResult;
  }

  loadValue(item: any) {
    this.loadValueByPosition(item, 'leftInput');
    this.loadValueByPosition(item, 'rightInput');
    this._leftInput.select();
  }

  loadValueByPosition(item: any, position: 'leftInput' | 'rightInput') {
    // is the field a complex object, "address.streetNumber"
    const fieldName = (position === 'leftInput') ? this._leftFieldName : this._rightFieldName;
    const originalValuePosition = (position === 'leftInput') ? 'originalLeftValue' : 'originalRightValue';
    const inputVarPosition = (position === 'leftInput') ? '_leftInput' : '_rightInput';
    const isComplexObject = fieldName && fieldName.indexOf('.') > 0;

    if (item && fieldName !== undefined && this.columnDef && (item.hasOwnProperty(fieldName) || isComplexObject)) {
      const itemValue = (isComplexObject) ? getDescendantProperty(item, fieldName) : (item.hasOwnProperty(fieldName) && item[fieldName] || '');
      this[originalValuePosition] = itemValue;
      if (this.editorParams[position].type === 'float') {
        const decimalPlaces = this.getDecimalPlaces(position);
        if (decimalPlaces !== null && (this[originalValuePosition] || this[originalValuePosition] === 0) && (+this[originalValuePosition]).toFixed) {
          this[originalValuePosition] = (+this[originalValuePosition]).toFixed(decimalPlaces);
        }
      }
      this[inputVarPosition].value = `${this[originalValuePosition]}`;
    }
  }

  save() {
    const validation = this.validate();
    const isValid = (validation && validation.valid) || false;
    const isChanged = this.isValueChanged();

    if (!this._isValueSaveCalled) {
      if (this.hasAutoCommitEdit && isValid) {
        this.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
      this._isValueSaveCalled = true;
    }
  }

  serializeValue() {
    return {
      [this._leftFieldName]: this.serializeValueByPosition('leftInput'),
      [this._rightFieldName]: this.serializeValueByPosition('rightInput')
    };
  }

  serializeValueByPosition(position: 'leftInput' | 'rightInput') {
    const elmValue = position === 'leftInput' ? this._leftInput.value : this._rightInput.value;
    if (elmValue === '' || isNaN(+elmValue)) {
      return elmValue;
    }

    let rtn = parseFloat(elmValue);
    const decPlaces = this.getDecimalPlaces(position);
    if (decPlaces !== null && (rtn || rtn === 0) && rtn.toFixed) {
      rtn = parseFloat(rtn.toFixed(decPlaces));
    }

    return rtn;
  }

  getDecimalPlaces(position: 'leftInput' | 'rightInput'): number {
    const defaultDecimalPlaces = 0; // TODO move into a constant

    // returns the number of fixed decimal places or null
    const positionSide = position === 'leftInput' ? 'leftInput' : 'rightInput';
    const sideParams = this.editorParams[positionSide];
    let rtn: number | undefined = sideParams?.decimal;

    if (rtn === undefined) {
      return defaultDecimalPlaces;
    }
    return rtn;
  }

  getInputDecimalSteps(position: 'leftInput' | 'rightInput'): string {
    const decimals = this.getDecimalPlaces(position);
    let zeroString = '';
    for (let i = 1; i < decimals; i++) {
      zeroString += '0';
    }

    if (decimals > 0) {
      return `0.${zeroString}1`;
    }
    return '1';
  }

  validate(): EditorValidatorOutput {
    const leftValidation = this.validateByPosition('leftInput');
    const rightValidation = this.validateByPosition('rightInput');

    if (!leftValidation.valid) {
      this._leftInput.select();
      return leftValidation;
    }
    if (!rightValidation.valid) {
      this._rightInput.select();
      return rightValidation;
    }
    return { valid: true, msg: null };
  }

  validateByPosition(position: 'leftInput' | 'rightInput'): EditorValidatorOutput {
    const positionEditorParams = this.editorParams[position];
    const input = position === 'leftInput' ? this._leftInput : this._rightInput;
    const currentVal = input?.value;
    const baseValidatorOptions = {
      editorArgs: this.args,
      errorMessage: positionEditorParams.errorMessage,
      required: positionEditorParams.required,
      validator: positionEditorParams.validator,
    };

    switch (positionEditorParams.type) {
      case 'float':
        return floatValidator(currentVal, {
          ...baseValidatorOptions,
          decimal: this.getDecimalPlaces(position),
          minValue: positionEditorParams.minValue,
          maxValue: positionEditorParams.maxValue,
          operatorConditionalType: positionEditorParams.operatorConditionalType,
        });
      case 'integer':
        return integerValidator(currentVal, {
          ...baseValidatorOptions,
          minValue: positionEditorParams.minValue,
          maxValue: positionEditorParams.maxValue,
          operatorConditionalType: positionEditorParams.operatorConditionalType,
        });
      case 'text':
      case 'password':
      default:
        return textValidator(currentVal, baseValidatorOptions);
    }
  }
}
