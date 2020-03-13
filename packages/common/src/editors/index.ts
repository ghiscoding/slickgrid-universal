import { LongTextEditor } from './longTextEditor';
import { MultipleSelectEditor } from './multipleSelectEditor';
import { SingleSelectEditor } from './singleSelectEditor';
import { SliderEditor } from './sliderEditor';
import { TextEditor } from './textEditor';

export const Editors = {
  /** Long Text Editor (uses a textarea) */
  longText: LongTextEditor,

  /** Multiple Select editor (which uses 3rd party lib "multiple-select.js") */
  multipleSelect: MultipleSelectEditor,

  /** Single Select editor (which uses 3rd party lib "multiple-select.js") */
  singleSelect: SingleSelectEditor,

  /** Slider Editor */
  slider: SliderEditor,

  /** Text Editor */
  text: TextEditor
};
