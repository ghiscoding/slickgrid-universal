import { emptyElement, getOffset } from '@slickgrid-universal/common';
import type {
  Column,
  CompositeEditorError,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorConstructor,
  EditorValidationResult,
  ElementPosition,
} from '@slickgrid-universal/common';
import type { HtmlElementPosition } from '@slickgrid-universal/utils';

export interface CompositeEditorArguments extends EditorArguments {
  formValues: any;
  isCompositeEditor: true;
}

export interface CompositeEditor extends Editor {
  getEditors: () => Array<Editor & { args: EditorArguments }>;
}

/**
 * Create a prototype-free dynamic map while retaining the historical
 * `map.hasOwnProperty(key)` compatibility used by some composite-editor consumers.
 */
function createSafeDynamicMap<T extends Record<string, any>>(initialValues?: T): T {
  const target = Object.create(null) as Record<string, any>;
  Object.keys(initialValues ?? {}).forEach((key) => {
    target[key] = initialValues![key];
  });

  return new Proxy(target, {
    get(map, property, receiver) {
      if (property === 'hasOwnProperty' && !Object.prototype.hasOwnProperty.call(map, property)) {
        return Object.prototype.hasOwnProperty.bind(map);
      }
      return Reflect.get(map, property, receiver);
    },
  }) as T;
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
export function SlickCompositeEditor(
  this: CompositeEditor,
  columns: Column[],
  containers: Array<HTMLDivElement>,
  options: CompositeEditorOption
): {
  (this: CompositeEditor, args: EditorArguments): void;
  prototype: any;
} {
  let firstInvalidEditor: Editor | null;
  const defaultOptions = {
    modalType: 'edit', // available type (create, clone, edit, mass)
    validationFailedMsg: 'Some of the fields have failed validation',
    validationMsgPrefix: null,
    show: null,
    hide: null,
    position: null,
    destroy: null,
    formValues: createSafeDynamicMap(),
    editors: Object.create(null),
  } as unknown as CompositeEditorOption;
  options = { ...defaultOptions, ...options };
  options.formValues = createSafeDynamicMap(options.formValues);
  let _timer: any;

  /* no operation (empty) function */
  const noop = () => {};

  const getContainerBox = (i: number): ElementPosition => {
    const container = containers[i];
    const { top, left } = getOffset(container);
    const width = container?.clientWidth ?? 0;
    const height = container?.clientHeight ?? 0;

    return {
      top,
      left,
      bottom: top + height,
      right: left + width,
      width,
      height,
      visible: true,
    };
  };

  /* Editor prototype that will get instantiated dynamically by looping through each Editors */
  function editor(this: CompositeEditor, args: EditorArguments) {
    // oxlint-disable-next-line @typescript-eslint/no-this-alias
    const context: CompositeEditor = this;
    let editors: Array<Editor & { args: EditorArguments }> = [];

    function init() {
      for (let idx = 0; idx < columns.length; idx++) {
        const column = columns[idx];
        if (!column.editorClass) {
          continue;
        }

        const currentEditor = new (column.editorClass as EditorConstructor)({
          ...args,
          container: containers[idx],
          column,
          position: getContainerBox(idx),
          commitChanges: noop,
          cancelChanges: noop,
          compositeEditorOptions: options,
          isCompositeEditor: true,
          formValues: createSafeDynamicMap(),
        } as CompositeEditorArguments);
        options.editors[column.id] = currentEditor; // add every Editor instance refs
        editors.push(currentEditor as Editor & { args: EditorArguments });
      }

      // focus on first input
      clearTimeout(_timer);
      _timer = setTimeout(() => {
        if (editors.length > 0 && typeof editors[0].focus === 'function') {
          editors[0].focus();
        }
      }, 0);
    }

    context.getEditors = () => editors;

    context.destroy = () => {
      clearTimeout(_timer);
      let editorToDestroy = editors.pop();
      while (editorToDestroy) {
        editorToDestroy.destroy();
        editorToDestroy = editors.pop();
      }

      let containerToRemove = containers.pop();
      while (containerToRemove) {
        emptyElement(containerToRemove);
        containerToRemove.remove();
        containerToRemove = containers.pop();
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
      for (let idx = 0; idx < editors.length; idx++) {
        if (editors[idx].isValueChanged()) {
          return true;
        }
      }
      return false;
    };

    context.serializeValue = () => {
      const values = [];
      for (let idx = 0; idx < editors.length; idx++) {
        values[idx] = editors[idx].serializeValue();
      }
      return values;
    };

    context.applyValue = (item: any, state: any) => {
      for (let idx = 0; idx < editors.length; idx++) {
        editors[idx].applyValue(item, state?.[idx]);
      }
    };

    context.loadValue = (item: any) => {
      for (let idx = 0; idx < editors.length; idx++) {
        editors[idx].loadValue(item);
      }
    };

    context.validate = (targetElm?: HTMLElement | null): EditorValidationResult => {
      let validationResults: EditorValidationResult;
      firstInvalidEditor = null;
      const errors: CompositeEditorError[] = [];

      let idx = 0;
      while (idx < editors.length) {
        const columnDef = editors[idx].args?.column;
        if (columnDef?.id !== undefined) {
          const compositeModalElm = document.querySelector(`.slick-editor-modal`);
          let validationElm = compositeModalElm?.querySelector(`.item-details-validation.editor-${columnDef.id}`);
          let labelElm = compositeModalElm?.querySelector(`.item-details-label.editor-${columnDef.id}`);
          let editorElm = compositeModalElm?.querySelector(`[data-editorid='${columnDef.id}']`);
          const validationMsgPrefix = options?.validationMsgPrefix ?? '';

          if (!targetElm || editorElm?.contains(targetElm)) {
            validationResults = editors[idx].validate();

            if (!validationResults.valid) {
              firstInvalidEditor = editors[idx];
              errors.push({
                index: idx,
                editor: editors[idx],
                container: containers[idx],
                msg: validationResults.msg || '',
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
          errors,
        };
      }
      return {
        valid: true,
        msg: '',
      };
    };

    context.hide = () => {
      for (let idx = 0; idx < editors.length; idx++) {
        editors[idx]?.hide?.();
      }
      options?.hide?.();
    };

    context.show = () => {
      for (let idx = 0; idx < editors.length; idx++) {
        editors[idx]?.show?.();
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
