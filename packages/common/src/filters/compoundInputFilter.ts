import { Constants } from '../constants';
import { FieldType, OperatorString, OperatorType, SearchTerm, } from '../enums/index';
import {
  Column,
  ColumnFilter,
  Filter,
  FilterArguments,
  FilterCallback,
  GridOption,
  Locale,
  SlickGrid,
} from '../interfaces/index';
import { buildSelectOperatorHtmlString } from './filterUtilities';
import { getTranslationPrefix, mapOperatorToShorthandDesignation } from '../services/utilities';
import { TranslaterService } from '../services/translater.service';

export class CompoundInputFilter implements Filter {
  protected _clearFilterTriggered = false;
  protected _shouldTriggerQuery = true;
  protected _inputType = 'text';
  protected $filterElm: any;
  protected $filterInputElm: any;
  protected $selectOperatorElm: any;
  protected _operator: OperatorType | OperatorString;
  grid: SlickGrid;
  searchTerms: SearchTerm[];
  columnDef: Column;
  callback: FilterCallback;

  constructor(protected readonly translaterService: TranslaterService) { }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get gridOptions(): GridOption {
    return (this.grid && this.grid.getOptions) ? this.grid.getOptions() : {};
  }

  /** Getter for the Filter Operator */
  get columnFilter(): ColumnFilter {
    return this.columnDef && this.columnDef.filter || {};
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType | OperatorString {
    return OperatorType.empty;
  }

  /** Getter of input type (text, number, password) */
  get inputType() {
    return this._inputType;
  }

  /** Setter of input type (text, number, password) */
  set inputType(type: string) {
    this._inputType = type;
  }

  /** Getter for the single Locale texts provided by the user in main file or else use default English locales via the Constants */
  get locales(): Locale {
    return this.gridOptions.locales || Constants.locales;
  }

  /** Getter of the Operator to use when doing the filter comparing */
  get operator(): OperatorType | OperatorString {
    return this._operator || this.defaultOperator;
  }

  /** Setter of the Operator to use when doing the filter comparing */
  set operator(op: OperatorType | OperatorString) {
    this._operator = op;
  }

  /**
   * Initialize the Filter
   */
  init(args: FilterArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
    }

    this.grid = args.grid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    this.operator = args.operator || '';
    this.searchTerms = (args.hasOwnProperty('searchTerms') ? args.searchTerms : []) || [];

    // filter input can only have 1 search term, so we will use the 1st array index if it exist
    const searchTerm = (Array.isArray(this.searchTerms) && this.searchTerms.length >= 0) ? this.searchTerms[0] : '';

    // step 1, create the DOM Element of the filter which contain the compound Operator+Input
    // and initialize it if searchTerm is filled
    this.$filterElm = this.createDomElement(searchTerm);

    // step 3, subscribe to the input change event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    this.$filterInputElm.on('keyup input', this.onTriggerEvent.bind(this));
    this.$selectOperatorElm.on('change', this.onTriggerEvent.bind(this));
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true) {
    if (this.$filterElm && this.$selectOperatorElm) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      this.$selectOperatorElm.val(0);
      this.$filterInputElm.val('');
      this.onTriggerEvent(undefined);
    }
  }

  /**
   * destroy the filter
   */
  destroy() {
    if (this.$filterElm && this.$selectOperatorElm) {
      this.$filterElm.off('keyup input').remove();
      this.$selectOperatorElm.off('change');
    }
    this.$filterElm = null;
    this.$selectOperatorElm = null;
  }

  /** Set value(s) on the DOM element  */
  setValues(values: SearchTerm[], operator?: OperatorType | OperatorString) {
    if (values) {
      const newValue = Array.isArray(values) ? values[0] : values;
      this.$filterInputElm.val(newValue);
    }

    // set the operator, in the DOM as well, when defined
    this.operator = operator || this.defaultOperator;
    if (operator && this.$selectOperatorElm) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this.$selectOperatorElm.val(operatorShorthand);
    }
  }

  //
  // protected functions
  // ------------------

  protected buildInputHtmlString() {
    const columnId = this.columnDef?.id ?? '';
    let placeholder = (this.gridOptions) ? (this.gridOptions.defaultFilterPlaceholder || '') : '';
    if (this.columnFilter && this.columnFilter.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }
    return `<input type="${this._inputType || 'text'}" class="form-control compound-input filter-${columnId}" role="presentation" autocomplete="off" placeholder="${placeholder}" /><span></span>`;
  }

  protected getOptionValues(): { operator: OperatorString, description: string }[] {
    const type = (this.columnDef.type && this.columnDef.type) ? this.columnDef.type : FieldType.string;
    let optionValues = [];

    switch (type) {
      case FieldType.string:
      case FieldType.text:
      case FieldType.readonly:
      case FieldType.password:
        optionValues = [
          { operator: '' as OperatorString, description: this.getOutputText('CONTAINS', 'TEXT_CONTAINS', 'Contains') },
          { operator: '=' as OperatorString, description: this.getOutputText('EQUALS', 'TEXT_EQUALS', 'Equals') },
          { operator: 'a*' as OperatorString, description: this.getOutputText('STARTS_WITH', 'TEXT_STARTS_WITH', 'Starts with') },
          { operator: '*z' as OperatorString, description: this.getOutputText('ENDS_WITH', 'TEXT_ENDS_WITH', 'Ends with') },
        ];
        break;
      default:
        optionValues = [
          { operator: '' as OperatorString, description: '' },
          { operator: '=' as OperatorString, description: this.getOutputText('EQUAL_TO', 'TEXT_EQUAL_TO', 'Equal to') },
          { operator: '<' as OperatorString, description: this.getOutputText('LESS_THAN', 'TEXT_LESS_THAN', 'Less than') },
          { operator: '<=' as OperatorString, description: this.getOutputText('LESS_THAN_OR_EQUAL_TO', 'TEXT_LESS_THAN_OR_EQUAL_TO', 'Less than or equal to') },
          { operator: '>' as OperatorString, description: this.getOutputText('GREATER_THAN', 'TEXT_GREATER_THAN', 'Greater than') },
          { operator: '>=' as OperatorString, description: this.getOutputText('GREATER_THAN_OR_EQUAL_TO', 'TEXT_GREATER_THAN_OR_EQUAL_TO', 'Greater than or equal to') },
          { operator: '<>' as OperatorString, description: this.getOutputText('NOT_EQUAL_TO', 'TEXT_NOT_EQUAL_TO', 'Not equal to') }
        ];
        break;
    }

    return optionValues;
  }

  /** Get Locale, Translated or a Default Text if first two aren't detected */
  protected getOutputText(translationKey: string, localeText: string, defaultText: string): string {
    if (this.gridOptions?.enableTranslate && this.translaterService?.translate) {
      const translationPrefix = getTranslationPrefix(this.gridOptions);
      return this.translaterService.translate(`${translationPrefix}${translationKey}`);
    }
    return this.locales?.[localeText] ?? defaultText;
  }

  /**
   * Create the DOM element
   */
  protected createDomElement(searchTerm?: SearchTerm) {
    const columnId = this.columnDef?.id ?? '';
    const $headerElm = this.grid.getHeaderRowColumn(columnId);
    $($headerElm).empty();

    // create the DOM Select dropdown for the Operator
    const selectOperatorHtmlString = buildSelectOperatorHtmlString(this.getOptionValues());
    this.$selectOperatorElm = $(selectOperatorHtmlString);
    this.$filterInputElm = $(this.buildInputHtmlString());
    const $filterContainerElm = $(`<div class="form-group search-filter filter-${columnId}"></div>`);
    const $containerInputGroup = $(`<div class="input-group"></div>`);
    const $operatorInputGroupAddon = $(`<div class="input-group-addon input-group-prepend operator"></div>`);

    /* the DOM element final structure will be
      <div class="input-group">
        <div class="input-group-addon input-group-prepend operator">
          <select class="form-control"></select>
        </div>
        <input class="form-control compound-input" type="text" />
      </div>
    */
    $operatorInputGroupAddon.append(this.$selectOperatorElm);
    $containerInputGroup.append($operatorInputGroupAddon);
    $containerInputGroup.append(this.$filterInputElm);

    // create the DOM element & add an ID and filter class
    $filterContainerElm.append($containerInputGroup);

    this.$filterInputElm.val(searchTerm);
    this.$filterInputElm.data('columnId', columnId);

    if (this.operator) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this.$selectOperatorElm.val(operatorShorthand);
    }

    // if there's a search term, we will add the "filled" class for styling purposes
    if (searchTerm) {
      $filterContainerElm.addClass('filled');
    }

    // append the new DOM element to the header row
    if ($filterContainerElm && typeof $filterContainerElm.appendTo === 'function') {
      $filterContainerElm.appendTo($headerElm);
    }

    return $filterContainerElm;
  }

  /** Event trigger, could be called by the Operator dropdown or the input itself */
  protected onTriggerEvent(e: KeyboardEvent | undefined) {
    // we'll use the "input" event for everything (keyup, change, mousewheel & spinner)
    // with 1 small exception, we need to use the keyup event to handle ENTER key, everything will be processed by the "input" event
    if (e && e.type === 'keyup' && e.key !== 'Enter') {
      return;
    }
    if (this._clearFilterTriggered) {
      this.callback(e, { columnDef: this.columnDef, clearFilterTriggered: this._clearFilterTriggered, shouldTriggerQuery: this._shouldTriggerQuery });
      this.$filterElm.removeClass('filled');
    } else {
      const selectedOperator = this.$selectOperatorElm.find('option:selected').val();
      let value = this.$filterInputElm.val() as string;
      const enableWhiteSpaceTrim = this.gridOptions.enableFilterTrimWhiteSpace || this.columnFilter.enableTrimWhiteSpace;
      if (typeof value === 'string' && enableWhiteSpaceTrim) {
        value = value.trim();
      }

      (value !== null && value !== undefined && value !== '') ? this.$filterElm.addClass('filled') : this.$filterElm.removeClass('filled');
      this.callback(e, { columnDef: this.columnDef, searchTerms: (value ? [value] : null), operator: selectedOperator || '', shouldTriggerQuery: this._shouldTriggerQuery });
    }

    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
  }
}
