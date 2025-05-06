import type { FieldType } from '../enums/index.js';
import type { Observable } from '../services/rxjsFacade.js';
import type {
  CollectionCustomStructure,
  CollectionFilterBy,
  CollectionOption,
  CollectionOverrideArgs,
  CollectionSortBy,
  EditorConstructor,
  EditorValidator,
} from './index.js';

export interface ColumnEditor {
  /**
   * Defaults to false, when set to True and user presses the ENTER key (on Editors that supports it),
   * it will always call a Save regardless if the current value is null and/or previous value was null
   */
  alwaysSaveOnEnterKey?: boolean;

  /** Optionally provide an aria-label for assistive scren reader, defaults to "{inputName} Input Editor" */
  ariaLabel?: string;

  /** A collection of items/options that will be loaded asynchronously (commonly used with Autocompleter & Single/Multi-Select Editors) */
  collectionAsync?: Promise<any> | Observable<any>;

  /**
   * A collection of items/options (commonly used with Autocompleter & Single/Multi-Select Editors)
   * It can be a collection of string or label/value pair (the pair can be customized via the "customStructure" option)
   */
  collection?: any[];

  /** We could filter 1 or more items from the collection (e.g. filter out some items from the select filter) */
  collectionFilterBy?: CollectionFilterBy | CollectionFilterBy[];

  /** Options to change the behavior of the "collection" */
  collectionOptions?: CollectionOption;

  /**
   * A collection override allows you to manipulate the collection provided to the Column Editor.
   * NOTE: if you provide a "customStructure" it will still be applied on the collection, in other words make sure that the collection returned by the override does have the properties defined in the "customStructure".
   */
  collectionOverride?: (collectionInput: any[], args: CollectionOverrideArgs) => any[];

  /** We could sort the collection by 1 or more properties, or by translated value(s) when enableTranslateLabel is True */
  collectionSortBy?: CollectionSortBy | CollectionSortBy[];

  /**
   * When providing a dot (.) notation in the "field" property of a column definition, we might want to use a different path for the editable object itself
   * For example if we provide a coldef = { field: 'user.name' } but we use a SingleSelect Editor with object values, we could override the path to simply 'user'
   */
  complexObjectPath?: string;

  /**
   * When using Composite Editor Modal, the inputs will show up with the order they were entered in the column definitions array.
   * You can use this option to provide a specific order to show these inputs in the form.
   */
  compositeEditorFormOrder?: number;

  /** A custom structure can be used instead of the default label/value pair. Commonly used with Select/Multi-Select Editor */
  customStructure?: CollectionCustomStructure;

  /** number of decimal places, works only with Editors supporting it (input float, integer, range, slider) */
  decimal?: number;

  /** is the Editor disabled when we first open it? This could happen when we use "collectionAsync" and we wait for the "collection" to be filled before enabling the Editor. */
  disabled?: boolean;

  /**
   * @deprecated @use `options` instead.
   * Options that could be provided to the Editor, example: `{ container: 'body', maxHeight: 250}`
   */
  editorOptions?: any;

  /**
   * Options, typically 3rd party lib options, that could be provided to the Editor, example: `{ container: 'body', maxHeight: 250}`
   *
   * Please note that if you use options that have model interfaces that exists,
   * you should always cast it with the "as X" (where X is the external lib options interface),
   * for example `{ options: {maxHeight: 250} as MultipleSelectOption }`
   */
  options?: any;

  /**
   * Defaults to false, when set it will render any HTML code instead of removing it (sanitized)
   * Currently only supported by the following Editors: Autocompleter, MultipleSelect & SingleSelect
   */
  enableRenderHtml?: boolean;

  /** Do we want the Editor to handle translation (localization)? */
  enableTranslateLabel?: boolean;

  /** Error message to display when validation fails */
  errorMessage?: string;

  /**
   * This flag can be used with a Composite Editor Modal for a "mass-update" or "mass-selection" change,
   * the modal form is being built dynamically by looping through all the column definition and it adds only the fields with the "massUpdate" enabled.
   */
  massUpdate?: boolean;

  /** Maximum length of the text value, works only with Editors supporting it (autocompleter, text, longText) */
  maxLength?: number;

  /** Maximum value of the editor, works only with Editors supporting it (number, float, slider) */
  maxValue?: number | string;

  /** Minimum length of the text value, works only with Editors supporting it (autocompleter, text, longText) */
  minLength?: number;

  /** Minimum value of the editor, works only with Editors supporting it (number, float, slider) */
  minValue?: number | string;

  /** SlickGrid Editor class or EditorConstructor function that implements Editor for the cell inline editing */
  model?: EditorConstructor;

  /** When the Filter is an external library, it could be useful to get its instance so that we could call any of the external library functions. */
  onInstantiated?: <T = any>(instance: T) => void;

  /**
   * Placeholder text that can be used by some Editors.
   * Note that this will override the default placeholder configured in the global config
   */
  placeholder?: string;

  /** Defaults to "inclusive", operator should be (inclusive or exclusive) when executing validation condition check against the minValue/maxValue. */
  operatorConditionalType?: 'inclusive' | 'exclusive';

  /**
   * Useful when you want to display a certain field to the UI, but you want to use another field to query when Filtering/Sorting.
   * Please note that it has higher precendence over the "field" property.
   */
  queryField?: string;

  /**
   * Defaults to false, is the field required to be valid?
   * Only on Editors that supports it.
   */
  required?: boolean;

  /**
   * defaults to 'object', how do we want to serialize the editor value to the resulting dataContext object when using a complex object?
   * Currently only applies to Single/Multiple Select Editor.
   *
   * For example, if keep default "object" format and the selected value is { value: 2, label: 'Two' } then the end value will remain as an object, so { value: 2, label: 'Two' }.
   * On the other end, if we set "flat" format and the selected value is { value: 2, label: 'Two' } then the end value will be 2.
   */
  serializeComplexValueFormat?: 'flat' | 'object';

  /**
   * Title attribute that can be used in some Editors as tooltip (usually the "input" editors).
   * To use this as a Tooltip, you can use "@slickgrid-universal/slick-custom-tooltip" plugin.
   */
  title?: string;

  /** What is the Field Type that can be used by the Editor (as precedence over the "type" set the column definition) */
  type?: (typeof FieldType)[keyof typeof FieldType];

  /** Editor Validator */
  validator?: EditorValidator;

  /** Step value of the editor, works only with Editors supporting it (input text, number, float, range, slider) */
  valueStep?: number | string;

  /**
   * Use "params" to pass any type of arguments to your Custom Editor
   * or regular Editor like the Editors.float
   * for example, if we don't want the slider number we could write
   * params: { decimalPlaces: 2 }
   */
  params?: any;
}
