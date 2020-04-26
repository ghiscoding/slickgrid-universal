import { KeyCode } from '../enums/keyCode.enum';
import { Column, ColumnEditor, ColumnEditorComboInput, Editor, EditorArguments, EditorValidator, EditorValidatorOutput } from '../interfaces/index';
import { getDescendantProperty, setDeepValue } from '../services/utilities';
import { floatValidator } from '../editorValidators/floatValidator';
import { textValidator, integerValidator } from '../editorValidators';

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class ComboInputEditor implements Editor {
  protected _inputType = 'number';
  private _cellContainerClassName: string;
  private _previousColumnItemIds: string;
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

  get hasAutoCommitEdit() {
    return this.grid.getOptions().autoCommitEdit;
  }


  /** Getter of input type (text, number, password) */
  get inputType() {
    return this._inputType;
  }

  /** Setter of input type (text, number, password) */
  set inputType(type: string) {
    this._inputType = type;
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
    const columnId = this.columnDef && this.columnDef.id;
    const itemId = this.args?.item?.id || 0;
    this._previousColumnItemIds = columnId + itemId;

    const containerElm = this.args?.container;
    if (containerElm && typeof containerElm.appendChild === 'function') {
      this._cellContainerClassName = containerElm.className;
      containerElm.appendChild(this._leftInput);
      containerElm.appendChild(this._rightInput);
    }

    this._leftInput.onkeydown = this.handleKeyDown;
    this._rightInput.onkeydown = this.handleKeyDown;
    // this._leftInput.oninput = this.restrictDecimalWhenProvided.bind(this, 'leftInput');
    // this._rightInput.oninput = this.restrictDecimalWhenProvided.bind(this, 'rightInput');

    // the lib does not get the focus out event for some reason, so register it here
    if (this.hasAutoCommitEdit) {
      // this._leftInput.addEventListener('focusout', this.handleFocusOut.bind(this));
      // this._rightInput.addEventListener('focusout', this.handleFocusOut.bind(this));
      // for the left input, we'll save if next element isn't a combo editor
      this._leftInput.addEventListener('focusout', (event: any) => {
        console.log('left focusout')
        const nextTargetClass = event.relatedTarget?.className || '';
        // const parentClass = this._cellContainerClassName.className || '';
        const columnId = this.columnDef && this.columnDef.id;
        const itemId = this.args?.item?.id || 0;
        console.log(nextTargetClass, columnId, itemId)
        const targetClassNames = event.relatedTarget?.className || '';
        // if (this._previousColumnItemIds !== (columnId + itemId)) {
        if (targetClassNames.indexOf('compound-editor') === -1 && this._lastEventType !== 'focusout') {
          // if (nextTargetClass !== parentClass) {
          console.log('calls save')
          this.save();
        }
        this._lastEventType = event.type;
        this._previousColumnItemIds = columnId + itemId;
      });
      this._rightInput.addEventListener('focusout', (event: any) => {
        console.log('right focusout')
        const nextTargetClass = event.relatedTarget?.parentNode?.className || '';
        // const parentClass = this._cellContainerClassName.className || '';
        console.log(nextTargetClass, columnId, itemId)
        if (nextTargetClass !== this._cellContainerClassName) {
          this.save();
        }
        this._lastEventType = event && event.type;
      });
    }

    setTimeout(() => this.focus(), 50);
  }

  handleKeyDown(event: KeyboardEvent) {
    this._lastInputKeyEvent = event;
    if (event.keyCode === KeyCode.LEFT || event.keyCode === KeyCode.RIGHT || event.keyCode === KeyCode.TAB) {
      event.stopImmediatePropagation();
    }
  }

  handleFocusOut(event: any) {
    const nextTargetClass = event.relatedTarget?.className || '';
    // const parentClass = this._cellContainerClassName.className || '';
    const columnId = this.columnDef && this.columnDef.id;
    const itemId = this.args?.item?.id || 0;
    console.log(this._previousColumnItemIds, columnId, itemId, this.args, 'nextTargetClass::', nextTargetClass)
    const targetClassNames = event.relatedTarget?.className || '';
    if (this._previousColumnItemIds !== (columnId + itemId)) {
      // if (this._previousColumnItemIds !== (columnId + itemId) || nextTargetClass.indexOf(`compound-editor-text editor-${columnId}`) === -1) {
      // if (targetClassNames.indexOf('compound-editor') === -1 && this._lastEventType !== 'focusout') {
      // if (nextTargetClass !== parentClass) {
      this.save();
    }
    this._lastEventType = event.type;
    this._previousColumnItemIds = columnId + itemId;
  }

  restrictDecimalWhenProvided(position: 'leftInput' | 'rightInput', event: KeyboardEvent & { target: HTMLInputElement }) {
    const maxDecimal = this.getDecimalPlaces(position);
    console.log(event.target.value)
    if (maxDecimal >= 0 && event && event.target) {
      const currentVal = event.target.value;
      // const pattern = maxDecimal === 0 ? '^-?[0-9]+' : `^-?\\d+\\.?\\d{0,${maxDecimal}}`;
      const pattern = maxDecimal === 0 ? '^-?\\d*$' : `^[1-9]\\d*(?:\\.\\d{0,${maxDecimal}})?$`;
      const regex = new RegExp(pattern);
      if (!regex.test(currentVal)) {
        console.log('invalid', currentVal, currentVal.substring(0, currentVal.length - 1))
        event.target.value = currentVal.substring(0, currentVal.length - 1);
      } else {
        console.log(currentVal, 'valid', maxDecimal, pattern, regex.test(currentVal))
      }
    }
  }

  destroy() {
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

    const input = document.createElement('input') as HTMLInputElement;
    input.id = `item-${itemId}`;
    input.className = `compound-editor-text editor-${columnId} ${position.replace(/input/gi, '')}`;
    input.type = editorSideParams?.type || 'text';
    input.setAttribute('role', 'presentation');
    input.autocomplete = 'off';
    input.placeholder = editorSideParams?.placeholder || '';
    input.title = editorSideParams?.title || '';
    input.step = this.getInputDecimalSteps(position);

    return input;
  }

  focus(): void {
    this._leftInput.focus();
    this._leftInput.select();
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
    // is the field a complex object, "address.streetNumber"
    const isComplexObject = this._leftFieldName && this._leftFieldName.indexOf('.') > 0;

    if (item && this._leftFieldName !== undefined && this.columnDef && (item.hasOwnProperty(this._leftFieldName) || isComplexObject)) {
      const leftValue = (isComplexObject) ? getDescendantProperty(item, this._leftFieldName) : (item.hasOwnProperty(this._leftFieldName) && item[this._leftFieldName] || '');
      this.originalLeftValue = leftValue;
      const leftDecimal = this.getDecimalPlaces('leftInput');
      if (leftDecimal !== null && (this.originalLeftValue || this.originalLeftValue === 0) && (+this.originalLeftValue).toFixed) {
        this.originalLeftValue = (+this.originalLeftValue).toFixed(leftDecimal);
      }
      this._leftInput.value = `${this.originalLeftValue}`;
      this._leftInput.select();
    }

    if (item && this._rightFieldName !== undefined && this.columnDef && (item.hasOwnProperty(this._rightFieldName) || isComplexObject)) {
      const rightValue = (isComplexObject) ? getDescendantProperty(item, this._rightFieldName) : (item.hasOwnProperty(this._rightFieldName) && item[this._rightFieldName] || '');
      this.originalRightValue = rightValue;
      const rightDecimal = this.getDecimalPlaces('rightInput');
      if (rightDecimal !== null && (this.originalRightValue || this.originalRightValue === 0) && (+this.originalRightValue).toFixed) {
        this.originalRightValue = (+this.originalRightValue).toFixed(rightDecimal);
      }
      this._rightInput.value = `${this.originalRightValue}`;
    }
  }

  save() {
    const validation = this.validate();
    const isValid = (validation && validation.valid) || false;

    if (this.hasAutoCommitEdit && isValid) {
      this.grid.getEditorLock().commitCurrentEdit();
    } else {
      this.args.commitChanges();
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
    let rtn = sideParams?.decimal;

    if (rtn === undefined) {
      rtn = defaultDecimalPlaces;
    }
    return (!rtn && rtn !== 0 ? null : rtn);
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
      return leftValidation;
    }
    if (!rightValidation.valid) {
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
        });
      case 'integer':
        return integerValidator(currentVal, {
          ...baseValidatorOptions,
          minValue: positionEditorParams.minValue,
          maxValue: positionEditorParams.maxValue,
        });
      case 'text':
      case 'password':
      default:
        return textValidator(currentVal, baseValidatorOptions);
    }
  }
}
