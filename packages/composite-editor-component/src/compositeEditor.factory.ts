import {
  Column,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidationResult,
  ElementPosition,
  HtmlElementPosition,
  SlickNamespace
} from '@slickgrid-universal/common';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

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
export function CompositeEditor(this: any, columns: Column[], containers: Array<HTMLDivElement>, options: CompositeEditorOption) {
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
  let firstInvalidEditor: any;

  const noop = function () { };

  function getContainerBox(i: number): ElementPosition {
    const c = containers[i];
    const offset = $(c).offset();
    const w = $(c).width() || 0;
    const h = $(c).height() || 0;

    return {
      top: offset?.top ?? 0,
      left: offset?.left ?? 0,
      bottom: (offset?.top ?? 0) + h,
      right: (offset?.left ?? 0) + w,
      width: w,
      height: h,
      visible: true
    };
  }

  /* Editor prototype that will get instantiated dynamically by looping through each Editors */
  function editor(this: any, args: EditorArguments) {
    let editors: Array<Editor & { args: EditorArguments }> = [];

    function init() {
      let newArgs: Partial<CompositeEditorArguments> = {};
      let idx = 0;
      while (idx < columns.length) {
        if (columns[idx].editor) {
          const column = columns[idx];
          newArgs = $.extend({}, args as unknown as CompositeEditorArguments);
          newArgs.container = containers[idx];
          newArgs.column = column;
          newArgs.position = getContainerBox(idx);
          newArgs.commitChanges = noop;
          newArgs.cancelChanges = noop;
          newArgs.compositeEditorOptions = options;
          newArgs.formValues = {};

          // column.editor as < typeof Editor;
          const currentEditor = new (column.editor as any)(newArgs);
          options.editors[column.id] = currentEditor; // add every Editor instance refs
          editors.push(currentEditor);
        }
        idx++;
      }

      // focus on first input
      setTimeout(function () {
        if (Array.isArray(editors) && editors.length > 0 && editors[0].focus) {
          editors[0].focus();
        }
      }, 0);
    }

    this.destroy = function () {
      let idx = 0;
      while (idx < editors.length) {
        editors[idx].destroy();
        idx++;
      }

      options?.destroy?.();
      editors = [];
    };


    this.focus = function () {
      // if validation has failed, set the focus to the first invalid editor
      (firstInvalidEditor || editors[0]).focus();
    };


    this.isValueChanged = function () {
      let idx = 0;
      while (idx < editors.length) {
        if (editors[idx].isValueChanged()) {
          return true;
        }
        idx++;
      }
      return false;
    };


    this.serializeValue = function () {
      const serializedValue = [];
      let idx = 0;
      while (idx < editors.length) {
        serializedValue[idx] = editors[idx].serializeValue();
        idx++;
      }
      return serializedValue;
    };


    this.applyValue = function (item: any, state: any) {
      let idx = 0;
      while (idx < editors.length) {
        editors[idx].applyValue(item, state[idx]);
        idx++;
      }
    };

    this.loadValue = function (item: any) {
      let idx = 0;

      while (idx < editors.length) {
        editors[idx].loadValue(item);
        idx++;
      }
    };


    this.validate = function (targetElm: HTMLElement) {
      let validationResults: EditorValidationResult;
      const errors = [];
      let $targetElm = targetElm ? $(targetElm) : null;

      firstInvalidEditor = null;

      let idx = 0;
      while (idx < editors.length) {
        const columnDef = editors[idx].args?.column ?? {};
        if (columnDef) {
          let $validationElm = $(`.item-details-validation.editor-${columnDef.id}`);
          let $labelElm = $(`.item-details-label.editor-${columnDef.id}`);
          let $editorElm = $(`[data-editorid=${columnDef.id}]`);
          const validationMsgPrefix = options?.validationMsgPrefix || '';

          if (!$targetElm || ($editorElm.has($targetElm as any).length > 0)) {
            validationResults = editors[idx].validate();

            if (!validationResults.valid) {
              firstInvalidEditor = editors[idx];
              errors.push({
                index: idx,
                editor: editors[idx],
                container: containers[idx],
                msg: validationResults.msg
              });

              if ($validationElm) {
                $validationElm.text(validationMsgPrefix + validationResults.msg);
                $labelElm.addClass('invalid');
                $editorElm.addClass('invalid');
              }
            } else if ($validationElm) {
              $validationElm.text('');
              $editorElm.removeClass('invalid');
              $labelElm.removeClass('invalid');
            }
          }
          $validationElm = null as any;
          $labelElm = null as any;
          $editorElm = null as any;
        }
        idx++;
      }
      $targetElm = null as any;

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


    this.hide = function () {
      let idx = 0;
      while (idx < editors.length) {
        editors[idx]?.hide?.();
        idx++;
      }
      options?.hide?.();
    };


    this.show = function () {
      let idx = 0;
      while (idx < editors.length) {
        editors[idx]?.show?.();
        idx++;
      }
      options?.show?.();
    };


    this.position = function (box: HtmlElementPosition) {
      options?.position?.(box);
    };

    // initialize current editor
    init();
  }

  // so we can do 'editor instanceof Slick.CompositeEditor OR instanceof CompositeEditor
  editor.prototype = this;
  Slick.CompositeEditor = editor as any;
  return editor;
}