import { Constants } from './../constants';
import { KeyCode } from '../enums/keyCode.enum';
import {
  Column,
  ColumnEditor,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidationResult,
  GridOption,
  HtmlElementPosition,
  Locale,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { getDescendantProperty, getHtmlElementOffset, getTranslationPrefix, setDeepValue } from '../services/utilities';
import { TranslaterService } from '../services/translater.service';
import { textValidator } from '../editorValidators/textValidator';

const DEFAULT_MAX_LENGTH = 500;

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/*
 * An example of a 'detached' editor.
 * The UI is added onto document BODY and .position(), .show() and .hide() are implemented.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class LongTextEditor implements Editor {
  private _locales: Locale;
  private _$textarea: any;
  private _$currentLengthElm: any;
  private _$wrapper: any;
  defaultValue: any;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Grid options */
  gridOptions: GridOption;

  /** The translate library */
  private _translater: TranslaterService;

  constructor(private args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.gridOptions = args.grid && args.grid.getOptions() as GridOption;
    const options = this.gridOptions || this.args.column.params || {};
    if (options && options.i18n) {
      this._translater = options.i18n;
    }

    // get locales provided by user in forRoot or else use default English locales via the Constants
    this._locales = this.gridOptions && this.gridOptions.locales || Constants.locales;

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
    return this._$textarea;
  }

  get hasAutoCommitEdit() {
    return this.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init(): void {
    let cancelText = '';
    let saveText = '';
    if (this._translater && this._translater.translate && this._translater.getCurrentLanguage && this._translater.getCurrentLanguage()) {
      const translationPrefix = getTranslationPrefix(this.gridOptions);
      cancelText = this._translater.translate(`${translationPrefix}CANCEL`);
      saveText = this._translater.translate(`${translationPrefix}SAVE`);
    } else {
      cancelText = this._locales && this._locales.TEXT_CANCEL;
      saveText = this._locales && this._locales.TEXT_SAVE;
    }

    const compositeEditorOptions = this.args.compositeEditorOptions;
    const columnId = this.columnDef?.id;
    const placeholder = this.columnEditor?.placeholder || '';
    const title = this.columnEditor?.title || '';
    const maxLength = this.columnEditor?.maxLength || DEFAULT_MAX_LENGTH;
    const textAreaRows = compositeEditorOptions ? 3 : (this.columnEditor?.params?.textAreaRows || 6);

    const $container = compositeEditorOptions ? this.args.container : $('body');
    this._$wrapper = $(`<div class="slick-large-editor-text editor-${columnId}" />`).appendTo($container);
    this._$wrapper.css({ position: (compositeEditorOptions ? 'relative' : 'absolute') });
    this._$textarea = $(`<textarea hidefocus rows="${textAreaRows}" placeholder="${placeholder}" title="${title}">`).appendTo(this._$wrapper);

    const editorFooterElm = $(`<div class="editor-footer"/>`);
    const countContainerElm = $(`<span class="counter"/>`);
    this._$currentLengthElm = $(`<span class="text-length">0</span>`);
    const textMaxLengthElm = $(`<span class="separator">/</span><span class="max-length">${maxLength}</span>`);
    this._$currentLengthElm.appendTo(countContainerElm);
    textMaxLengthElm.appendTo(countContainerElm);
    countContainerElm.appendTo(editorFooterElm);

    if (!compositeEditorOptions) {
      const cancelBtnElm = $(`<button class="btn btn-cancel btn-default btn-xs">${cancelText}</button>`);
      const saveBtnElm = $(`<button class="btn btn-save btn-primary btn-xs">${saveText}</button>`);
      cancelBtnElm.appendTo(editorFooterElm);
      saveBtnElm.appendTo(editorFooterElm);
    }
    editorFooterElm.appendTo(this._$wrapper);

    this._$textarea.on('keydown', this.handleKeyDown.bind(this));
    this._$textarea.on('keyup', this.handleKeyUp.bind(this));

    if (compositeEditorOptions) {
      this._$textarea.on('change', (event: KeyboardEvent) => this.handleChangeOnCompositeEditor(event, compositeEditorOptions));
    } else {
      this.position(this.args && this.args.position);
      this._$wrapper.find('.btn-save').on('click', () => this.save());
      this._$wrapper.find('.btn-cancel').on('click', () => this.cancel());
      this._$textarea.focus().select();
    }
  }

  cancel() {
    const value = this.defaultValue || '';
    this._$textarea.val(value);
    this._$currentLengthElm.text(value.length);
    if (this.args && this.args.cancelChanges) {
      this.args.cancelChanges();
    }
  }

  hide() {
    this._$wrapper.hide();
  }

  show() {
    this._$wrapper.show();
  }

  destroy() {
    this._$wrapper.remove();
  }

  focus() {
    this._$textarea.focus().select();
  }

  getValue(): string {
    return this._$textarea.val();
  }

  setValue(val: string) {
    this._$textarea.val(val);
    this._$currentLengthElm.text(val.length);
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
    const elmValue = this._$textarea.val();
    return (!(elmValue === '' && (this.defaultValue === null || this.defaultValue === undefined))) && (elmValue !== this.defaultValue);
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];

      this.defaultValue = value || '';
      this._$textarea.val(this.defaultValue);
      this._$currentLengthElm.text(this.defaultValue.length);
      this._$textarea[0].defaultValue = this.defaultValue;
      this._$textarea.select();
    }
  }

  position(parentPosition: HtmlElementPosition) {
    const containerOffset = getHtmlElementOffset(this.args.container);

    this._$wrapper
      .css('top', (containerOffset.top || parentPosition.top || 0))
      .css('left', (containerOffset.left || parentPosition.left || 0));
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
    return this._$textarea.val();
  }

  validate(_targetElm?: null, inputValue?: any): EditorValidationResult {
    const elmValue = (inputValue !== undefined) ? inputValue : this._$textarea && this._$textarea.val && this._$textarea.val();
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

  private handleKeyDown(event: KeyboardEvent) {
    const keyCode = event.keyCode || event.code;

    if (!this.args.compositeEditorOptions) {
      if (keyCode === KeyCode.ENTER && event.ctrlKey) {
        this.save();
      } else if (keyCode === KeyCode.ESCAPE) {
        event.preventDefault();
        this.cancel();
      } else if (keyCode === KeyCode.TAB && event.shiftKey) {
        event.preventDefault();
        if (this.args && this.grid) {
          this.grid.navigatePrev();
        }
      } else if (keyCode === KeyCode.TAB) {
        event.preventDefault();
        if (this.args && this.grid) {
          this.grid.navigateNext();
        }
      }
    }
  }

  /** On every keyup event, we'll update the current text length counter */
  private handleKeyUp(event: KeyboardEvent & { target: HTMLTextAreaElement }) {
    const textLength = event.target.value.length;
    this._$currentLengthElm.text(textLength);
  }

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
