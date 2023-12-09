import type {
  Column,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidationResult,
  ElementPosition,
  HtmlElementPosition,
} from '@slickgrid-universal/common';
import {
  emptyElement,
  getOffset,
} from '@slickgrid-universal/common';

export interface CompositeEditorArguments extends EditorArguments {
  formValues: any;
}

/**
 * A composite SlickGrid editor factory.
 * Generates an editor that is composed of multiple editors for given columns.
 * Individual editors are provided given containers instead of the original cell.
 * Validation will be performed on all editors individually and the results will be aggregated into one
 * validation result.
 *
 *
 * The returned editor will have its prototype set to CompositeEditor, so you can use the "instanceof" check.
 *
 * NOTE:  This doesn't work for detached editors since they will be created and positioned relative to the
 *        active cell and not the provided container.
 *
 * @class CompositeEditor
 * @constructor
 * @param columns {Array} Column definitions from which editors will be pulled.
 * @param containers {Array} Container HTMLElements in which editors will be placed.
 * @param options {Object} Options hash:
 *  validationFailedMsg     -   A generic failed validation message set on the aggregated validation resuls.
 *  validationMsgPrefix     -   Add an optional prefix to each validation message (only the ones shown in the modal form, not the ones in the "errors")
 *  modalType               -   Defaults to "edit", modal type can 1 of these 3: (create, edit, mass, mass-selection)
 *  hide                    -   A function to be called when the grid asks the editor to hide itself.
 *  show                    -   A function to be called when the grid asks the editor to show itself.
 *  position                -   A function to be called when the grid asks the editor to reposition itself.
 *  destroy                 -   A function to be called when the editor is destroyed.
 */
export function SlickCompositeEditor(this: any, columns: Column[], containers: Array<HTMLDivElement>, options: CompositeEditorOption) {
  let firstInvalidEditor: Editor | null;
  const defaultOptions = {
    modalType: 'edit', // available type (create, clone, edit, mass)
    validationFailedMsg: 'Some of the fields have failed validation',
    validationMsgPrefix: null,
    show: null,
    hide: null,
    position: null,
    destroy: null,
    formValues: {},
    editors: {}
  } as unknown as CompositeEditorOption;
  options = { ...defaultOptions, ...options };

  /* no operation (empty) function */
  const noop = () => { };

  const getContainerBox = (i: number): ElementPosition => {
    const container = containers[i];
    const offset = getOffset(container);
    const width = container?.clientWidth ?? 0;
    const height = container?.clientHeight ?? 0;

    return {
      top: offset?.top ?? 0,
      left: offset?.left ?? 0,
      bottom: (offset?.top ?? 0) + height,
      right: (offset?.left ?? 0) + width,
      width,
      height,
      visible: true
    };
  };

  /* Editor prototype that will get instantiated dynamically by looping through each Editors */
  function editor(this: any, args: EditorArguments) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context: any = this;
    let editors: Array<Editor & { args: EditorArguments }> = [];

    function init() {
      let newArgs: Partial<CompositeEditorArguments> = {};
      let idx = 0;
      while (idx < columns.length) {
        if (columns[idx].editor) {
          const column = columns[idx];
          newArgs = { ...args };
          newArgs.container = containers[idx];
          newArgs.column = column;
          newArgs.position = getContainerBox(idx);
          newArgs.commitChanges = noop;
          newArgs.cancelChanges = noop;
          newArgs.compositeEditorOptions = options;
          newArgs.formValues = {};

          const currentEditor = new (column.editor as any)(newArgs) as Editor & { args: EditorArguments };
          options.editors[column.id] = currentEditor; // add every Editor instance refs
          editors.push(currentEditor);
        }
        idx++;
      }

      // focus on first input
      setTimeout(() => {
        if (Array.isArray(editors) && editors.length > 0 && typeof editors[0].focus === 'function') {
          editors[0].focus();
        }
      }, 0);
    }

    context.getEditors = () => {
      return editors;
    };

    context.destroy = () => {
      let tmpEditor = editors.pop();
      while (tmpEditor) {
        tmpEditor?.destroy();
        tmpEditor = editors.pop();
      }

      let tmpContainer = containers.pop();
      while (tmpContainer) {
        emptyElement(tmpContainer);
        tmpContainer?.remove();
        tmpContainer = containers.pop();
      }

      options?.destroy?.();
      editors = [];
      containers = null as any;
    };

    context.focus = () => {
      // if validation has failed, set the focus to the first invalid editor
      (firstInvalidEditor || editors[0]).focus();
    };

    context.isValueChanged = () => {
      let idx = 0;
      while (idx < editors.length) {
        if (editors[idx].isValueChanged()) {
          return true;
        }
        idx++;
      }
      return false;
    };

    context.serializeValue = () => {
      const serializedValue = [];
      let idx = 0;
      while (idx < editors.length) {
        serializedValue[idx] = editors[idx].serializeValue();
        idx++;
      }
      return serializedValue;
    };

    context.applyValue = (item: any, state: any) => {
      let idx = 0;
      while (idx < editors.length) {
        editors[idx].applyValue(item, state?.[idx]);
        idx++;
      }
    };

    context.loadValue = (item: any) => {
      let idx = 0;

      while (idx < editors.length) {
        editors[idx].loadValue(item);
        idx++;
      }
    };

    context.validate = (targetElm: HTMLElement | null) => {
      let validationResults: EditorValidationResult;
      firstInvalidEditor = null;
      const errors = [];

      let idx = 0;
      while (idx < editors.length) {
        const columnDef = editors[idx].args?.column;
        if (columnDef?.id !== undefined) {
          const compositeModalElm = document.querySelector(`.slick-editor-modal`);
          let validationElm = compositeModalElm?.querySelector(`.item-details-validation.editor-${columnDef.id}`);
          let labelElm = compositeModalElm?.querySelector(`.item-details-label.editor-${columnDef.id}`);
          let editorElm = compositeModalElm?.querySelector(`[data-editorid=${columnDef.id}]`);
          const validationMsgPrefix = options?.validationMsgPrefix ?? '';

          if (!targetElm || editorElm?.contains(targetElm)) {
            validationResults = editors[idx].validate();

            if (!validationResults.valid) {
              firstInvalidEditor = editors[idx];
              errors.push({
                index: idx,
                editor: editors[idx],
                container: containers[idx],
                msg: validationResults.msg
              });

              if (validationElm) {
                validationElm.textContent = `${validationMsgPrefix}${validationResults.msg}`;
                labelElm?.classList.add('invalid');
                editorElm?.classList.add('invalid');
              }
            } else if (validationElm) {
              validationElm.textContent = '';
              editorElm?.classList.remove('invalid');
              labelElm?.classList.remove('invalid');
            }
          }
          validationElm = null;
          labelElm = null;
          editorElm = null;
        }
        idx++;
      }
      targetElm = null;

      if (errors.length) {
        return {
          valid: false,
          msg: options.validationFailedMsg,
          errors
        };
      }
      return {
        valid: true,
        msg: ''
      };
    };

    context.hide = () => {
      let idx = 0;
      while (idx < editors.length) {
        editors[idx]?.hide?.();
        idx++;
      }
      options?.hide?.();
    };

    context.show = () => {
      let idx = 0;
      while (idx < editors.length) {
        editors[idx]?.show?.();
        idx++;
      }
      options?.show?.();
    };

    context.position = (box: HtmlElementPosition) => {
      options?.position?.(box);
    };

    // initialize current editor
    init();
  }

  // so we can do editor instanceof SlickCompositeEditor OR instanceof CompositeEditor
  editor.prototype = this;

  return editor;
}