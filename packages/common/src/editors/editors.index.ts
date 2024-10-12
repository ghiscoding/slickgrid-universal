import type { EditorConstructor } from '../interfaces/editor.interface.js';
import { AutocompleterEditor } from './autocompleterEditor.js';
import { CheckboxEditor } from './checkboxEditor.js';
import { DateEditor } from './dateEditor.js';
import { DualInputEditor } from './dualInputEditor.js';
import { FloatEditor } from './floatEditor.js';
import { InputEditor } from './inputEditor.js';
import { InputPasswordEditor } from './inputPasswordEditor.js';
import { IntegerEditor } from './integerEditor.js';
import { LongTextEditor } from './longTextEditor.js';
import { MultipleSelectEditor } from './multipleSelectEditor.js';
import { SingleSelectEditor } from './singleSelectEditor.js';
import { SliderEditor } from './sliderEditor.js';

export const Editors: Record<string, EditorConstructor> = {
  /** Autocompleter Editor (using https://github.com/kraaden/autocomplete) */
  autocompleter: AutocompleterEditor,

  /** Checkbox Editor (uses native checkbox DOM element) */
  checkbox: CheckboxEditor,

  /** Date Picker Editor (which uses 3rd party lib "vanilla-calendar-pro") */
  date: DateEditor,

  /** Dual Input Editor, default input type is text but it could be (integer/float/number/password/text) */
  dualInput: DualInputEditor,

  /** Float Number Editor using an input of type "number" */
  float: FloatEditor,

  /** Integer Number Editor using an input of type "number" */
  integer: IntegerEditor,

  /**
   * Long Text Editor (uses a textarea) for longer text (you can also optionally configure its size).
   * When ready to Save you can click on the "Save" and/or use shortcuts (Ctrl+ENTER or Ctrl+s).
   */
  longText: LongTextEditor,

  /** Multiple Select editor (which uses 3rd party lib "multiple-select.js") */
  multipleSelect: MultipleSelectEditor,

  /** Editor with an input of type Password (note that only the text shown in the UI will be masked, the editor value is still plain text) */
  password: InputPasswordEditor,

  /** Single Select editor (which uses 3rd party lib "multiple-select.js") */
  singleSelect: SingleSelectEditor,

  /** Slider Editor using an input of type "range" */
  slider: SliderEditor,

  /** text Editor using an input of type "text" (this is the default editor when no type is provided) */
  text: InputEditor
};
