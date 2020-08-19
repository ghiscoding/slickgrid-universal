import {
  Column,
  CompositeEditorError,
  CompositeEditorOption,
  Editor,
  EditorValidatorOutput,
  HtmlElementPosition,
} from '../interfaces/index';

/**
 * Composite Editor Extension (dynamically create all row Editors into a Composite Editor that is shown in a Modal Editor window)
 * based on Slick.CompositeEditor from https://github.com/6pac/SlickGrid/blob/master/examples/example-composite-editor-item-details.html
 */
export class CompositeEditorExtension implements Editor {
  defaultOptions: CompositeEditorOption = {
    validationFailedMsg: 'Some of the fields have failed validation',
    show: undefined,
    hide: undefined,
    position: undefined,
    destroy: undefined
  };

  firstInvalidEditor: Editor | null;

  constructor(private columns: Column[], private containers: Array<HTMLElement | null>, private options: Partial<CompositeEditorOption>) {
    options = $.extend({}, this.defaultOptions, options);

    // so we can do "editor instanceof Slick.CompositeEditor
    this.editor.prototype = this;
  }

  getContainerBox(index: number) {
    const container = this.containers[index];
    const offset = container && $(container).offset();
    const width = container && $(container).width() || 0;
    const height = container && $(container).height() || 0;

    return {
      top: (offset?.top ?? 0),
      left: (offset?.left ?? 0),
      bottom: (offset?.top ?? 0) + height,
      right: (offset?.left ?? 0) + width,
      width,
      height,
      visible: true
    };
  }

  // declare all the possible methods of an Editor, those will be overriden by looping in each column editor in the "init()" below
  init() { }
  destroy() { }
  focus() { }
  isValueChanged() { return true; }
  serializeValue() { }
  applyValue(item: any, state: any) { }
  loadValue(item: any) { }
  validate(): EditorValidatorOutput { return { valid: true, msg: '' }; }
  hide() { }
  show() { }
  position(parentPosition: HtmlElementPosition) { }

  editor(args: any) {
    const editors: Editor[] = [];

    const init = () => {
      let newArgs: any = {};
      this.columns.forEach((columnDef, idx) => {
        if (columnDef.editor) {
          newArgs = $.extend({}, args);
          newArgs.container = this.containers[idx];
          newArgs.column = columnDef;
          newArgs.position = this.getContainerBox(idx);
          newArgs.commitChanges = () => { };
          newArgs.cancelChanges = () => { };
          newArgs.isCompositeEditor = true;

          editors.push(new (columnDef.editor)(newArgs));
        }
      });

      // focus on first input after page is rendered
      setTimeout(() => editors[0].focus(), 0);
    };


    this.destroy = () => {
      for (const editor of editors) {
        if (typeof editor?.destroy === 'function') {
          editor.destroy();
        }
      }

      this.options.destroy && this.options.destroy();
    };

    this.focus = () => {
      // if validation has failed, set the focus to the first invalid editor
      (this.firstInvalidEditor || editors[0]).focus();
    };

    this.isValueChanged = () => {
      for (const editor of editors) {
        if (editor.isValueChanged()) {
          return true;
        }
      }

      return false;
    };

    this.serializeValue = (): any[] => {
      const serializedValue: any[] = [];
      editors.forEach((editor, idx) => {
        if (typeof editor?.serializeValue === 'function') {
          serializedValue[idx] = editor.serializeValue();
        }
      });

      return serializedValue;
    };

    this.applyValue = (item: any, state: any) => {
      editors.forEach((editor, idx) => {
        if (typeof editor?.applyValue === 'function') {
          editor.applyValue(item, state[idx]);
        }
      });
    };

    this.loadValue = (item: any) => {
      for (const editor of editors) {
        if (typeof editor?.loadValue === 'function') {
          editor.loadValue(item);
        }
      }
    };

    this.validate = (): EditorValidatorOutput => {
      let validationResults;

      const errors: CompositeEditorError[] = [];

      this.firstInvalidEditor = null;

      editors.forEach((editor, index) => {
        const columnDef: Column = (editor as any)?.args?.column;
        if (columnDef) {
          const $validationElm = $('.slick-editor-detail-validation.editor-' + columnDef.id);
          validationResults = editor.validate();

          if (!validationResults.valid) {
            this.firstInvalidEditor = editor;
            errors.push({
              index,
              editor,
              container: this.containers[index],
              msg: (validationResults.msg) as string
            });

            if ($validationElm) {
              $validationElm.text(validationResults?.msg ?? '');
              $validationElm.show();
            }
          } else if ($validationElm) {
            $validationElm.hide();
          }
        }
      });

      if (errors.length) {
        return { valid: false, msg: this.options?.validationFailedMsg ?? '', errors };
      } else {
        return { valid: true, msg: '' };
      }
    };

    this.hide = () => {
      for (const editor of editors) {
        if (typeof editor?.hide === 'function') {
          editor.hide();
        }
      }
      this.options.hide && this.options.hide();
    };

    this.show = () => {
      for (const editor of editors) {
        if (typeof editor?.show === 'function') {
          editor.show();
        }
      }
      this.options.show && this.options.show();
    };

    this.position = (parentPosition: HtmlElementPosition) => {
      this.options.position && this.options.position(parentPosition);
    };

    // initialize all column Editors
    init();
  }
}
