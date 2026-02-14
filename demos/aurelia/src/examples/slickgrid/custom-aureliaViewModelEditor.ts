import type { IBindingContext } from '@aurelia/runtime';
import type { ICustomElementController } from '@aurelia/runtime-html';
import {
  AureliaUtilService,
  type Column,
  type Editor,
  type EditorValidationResult,
  type EditorValidator,
  type GridOption,
  type SlickGrid,
  type ViewModelBindableInputData,
} from 'aurelia-slickgrid';

/*
 * An example of a 'detaching' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class CustomAureliaViewModelEditor implements Editor {
  /** Aurelia ViewModel Reference */
  aureliaViewModel: any;

  /** default item Id */
  defaultId?: string;

  /** default item object */
  defaultItem: any;

  selectedItem: any;

  /** SlickGrid grid object */
  grid: SlickGrid;
  vm?: { controller?: ICustomElementController } | null;
  elmBindingContext?: IBindingContext;

  constructor(private args: any) {
    this.grid = args?.grid;
    this.init();
  }

  /** Aurelia Util Service (could be inside the Grid Options Params or the Editor Params ) */
  get aureliaUtilService(): AureliaUtilService {
    let aureliaUtilService = this.gridOptions?.params?.aureliaUtilService;
    if (!aureliaUtilService || !(aureliaUtilService instanceof AureliaUtilService)) {
      aureliaUtilService = this.columnEditor?.params?.aureliaUtilService;
    }
    return aureliaUtilService;
  }

  /** Get the Collection */
  get collection(): any[] {
    return this.columnDef?.editor?.collection ?? [];
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args?.column ?? {};
  }

  /** Get Column Editor object */
  get columnEditor(): any {
    return this.columnDef?.editor ?? {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return (this.grid?.getOptions() ?? {}) as GridOption;
  }

  get hasAutoCommitEdit() {
    return this.args.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator {
    return this.columnEditor.validator || this.columnDef.validator;
  }

  async init() {
    if (!this.columnEditor?.params?.viewModel) {
      throw new Error(`[Aurelia-Slickgrid] For the Editors.aureliaComponent to work properly, you need to fill in the "templateUrl" property of your Custom Element Editor.
      Example: this.columnDefs = [{ id: 'title', field: 'title', editor: { model: CustomEditor, collection: [...], param: { viewModel: MyVM } },`);
    }
    if (this.columnEditor?.params?.viewModel) {
      const bindableData = {
        grid: this.grid,
        model: {
          collection: this.collection,
        },
      } as ViewModelBindableInputData;
      const viewModel = this.columnEditor.params.viewModel;
      this.vm = await this.aureliaUtilService.createAureliaViewModelAddToSlot(viewModel, bindableData, this.args.container);
      this.elmBindingContext = this.vm?.controller?.children?.[0].scope.bindingContext;
    }
  }

  save() {
    const validation = this.validate();
    if (validation && validation.valid) {
      if (this.hasAutoCommitEdit) {
        this.args.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
    }
  }

  cancel() {
    if (this.elmBindingContext) {
      this.elmBindingContext.selectedItem = this.defaultItem;
    }
    if (this.args?.cancelChanges) {
      this.args.cancelChanges();
    }
  }

  /** destroy the Aurelia ViewModel & Subscription */
  destroy() {
    this.vm?.controller?.deactivate(this.vm.controller, null);
  }

  /** optional, implement a hide method on your Aurelia ViewModel */
  hide() {
    this.elmBindingContext?.hide();
  }

  /** optional, implement a show method on your Aurelia ViewModel */
  show() {
    this.elmBindingContext?.focus();
  }

  /** optional, implement a focus method on your Aurelia ViewModel */
  focus() {
    this.elmBindingContext?.focus();
  }

  applyValue(item: any, state: any) {
    item[this.columnDef.field] = state;
  }

  getValue() {
    return this.elmBindingContext?.selectedItem.id;
  }

  loadValue(item: any) {
    const itemObject = item?.[this.columnDef.field];
    this.selectedItem = itemObject;
    this.defaultItem = itemObject;

    // add a delay so that the editor has time to be enhanced (created) prior to changing the value
    setTimeout(() => {
      this.focus();
      if (this.elmBindingContext) {
        this.elmBindingContext.selectedItem = itemObject;

        // whenever the selected item changed (from the @bindable() selectedItem), we'll save the new value
        this.elmBindingContext.selectedItemChanged = (newItem: any) => {
          this.selectedItem = newItem;
          if (newItem !== itemObject) {
            this.save();
          }
        };
      }
    }, 0);
  }

  serializeValue(): any {
    return this.selectedItem;
  }

  isValueChanged() {
    return (
      !(this.selectedItem.id === '' && (this.defaultId === null || this.defaultId === undefined)) && this.selectedItem.id !== this.defaultId
    );
  }

  validate(): EditorValidationResult {
    if (this.validator) {
      const value = this.selectedItem.id;
      return this.validator(value, this.args);
    }

    // by default the editor is always valid
    // if user want it to be required, he would have to provide his own validator
    return {
      valid: true,
      msg: null,
    };
  }
}
