import {
  type Column,
  type Editor,
  type EditorValidator,
  type EditorValidationResult,
  type GridOption,
  type SlickGrid,
} from 'slickgrid-vue';
import { type App, type ComponentPublicInstance, createApp } from 'vue';

interface Props {
  focus: () => void;
  hide: () => void;
  show: () => void;
  onSelectedItemChanged: (selectedItem: any) => void;
}

/*
 * An example of a SlickGrid Editor class using Vue Components
 * Note that this must be a TypeScript class implemeting the Editor interface that SlickGrid can instantiate
 */
export class CustomVueComponentEditor implements Editor {
  /** Vue Component instance */
  compApp?: App<Element>;

  /** Vue Component instance */
  compInstance?: ComponentPublicInstance<any, Props>;

  /** default item Id */
  defaultId?: string;

  /** default item object */
  defaultItem: any;

  selectedItem: any;

  /** SlickGrid grid object */
  grid: SlickGrid;

  constructor(private args: any) {
    this.grid = args?.grid;
    this.init();
  }

  /** Vue Util Service (could be inside the Grid Options Params or the Editor Params ) */
  get vueUtilService(): any {
    let vueUtilService = this.gridOptions?.params?.vueUtilService;
    if (!vueUtilService || !(vueUtilService instanceof vueUtilService)) {
      vueUtilService = this.columnEditor?.params?.vueUtilService;
    }
    return vueUtilService;
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
    const component = this.columnEditor?.params?.component;
    if (!component) {
      throw new Error(`[Slickgrid-Vue] For the Editors CustomVueComponentEditor to work properly, you need to fill the "params.component" property.
      Example: this.columnDefs = [{ id: 'title', field: 'title', editor: { model: CustomVueComponentEditor, collection: [...], param: { component: MyComponent } },`);
    }

    const bindableData = {
      grid: this.grid,
      model: {
        collection: this.collection,
      },
      onSelectedItemChanged: (newItem: any) => {
        if (newItem !== this.selectedItem) {
          this.selectedItem = newItem;
          this.save();
        }
      },
    } as Record<string, unknown>;

    const tmpDiv = document.createElement('div');
    this.compApp = createApp(component, bindableData);
    this.compInstance = this.compApp.mount(tmpDiv) as ComponentPublicInstance;
    this.args.container.replaceChildren(this.compInstance.$el);
  }

  save() {
    const validation = this.validate();
    if (validation?.valid) {
      if (this.hasAutoCommitEdit) {
        this.args.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
    }
  }

  cancel() {
    if (this.compInstance) {
      this.selectedItem = this.defaultItem;
      this.compInstance.setValue(this.defaultItem);
    }
    if (this.args?.cancelChanges) {
      this.args.cancelChanges();
    }
  }

  /** destroy the Vue ViewModel & Subscription */
  destroy() {
    this.compApp?.unmount();
  }

  /** optional, implement a hide method on your Vue ViewModel */
  hide() {
    this.compInstance?.hide();
  }

  /** optional, implement a show method on your Vue ViewModel */
  show() {
    this.compInstance?.focus();
  }

  /** optional, implement a focus method on your Vue ViewModel */
  focus() {
    this.compInstance?.focus();
  }

  applyValue(item: any, state: any) {
    item[this.columnDef.field] = state;
  }

  getValue() {
    return this.selectedItem?.id;
  }

  loadValue(item: any) {
    const itemObject = item?.[this.columnDef.field];
    this.selectedItem = itemObject;
    this.defaultItem = itemObject;
    this.compInstance?.setValue(itemObject);
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
