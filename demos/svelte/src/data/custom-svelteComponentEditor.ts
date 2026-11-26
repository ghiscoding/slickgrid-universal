import type { Column, Editor, EditorArguments, EditorValidationResult, EditorValidator } from 'slickgrid-svelte';
import { mount, unmount } from 'svelte';
import AssigneeSelect from '../AssigneeSelect.svelte';
import type { Assignee } from './assignee.model.js';

interface AssigneeSelectInstance {
  focus: () => void;
  hide: () => void;
  show: () => void;
  setValue: (item: Assignee | undefined) => void;
}

/** A custom Svelte component mounted as a SlickGrid cell editor. */
export class CustomSvelteComponentEditor implements Editor {
  private component?: AssigneeSelectInstance;
  private defaultItem?: Assignee;
  private selectedItem?: Assignee;

  constructor(private readonly args: EditorArguments) {
    this.component = mount(AssigneeSelect, {
      target: args.container,
      props: {
        collection: this.collection,
        selectedItem: this.selectedItem,
        onSelectedItemChanged: (item: Assignee | undefined) => {
          this.selectedItem = item;
          this.save();
        },
      },
    }) as unknown as AssigneeSelectInstance;
  }

  init(): void {}

  get columnDef(): Column {
    return this.args.column;
  }

  get collection(): Assignee[] {
    return this.columnDef.editor?.collection ?? [];
  }

  get validator(): EditorValidator | undefined {
    return this.columnDef.editor?.validator ?? this.columnDef.validator;
  }

  getValue(): Assignee | undefined {
    return this.selectedItem;
  }

  setValue(value: Assignee | undefined): void {
    this.selectedItem = value;
    this.component?.setValue(value);
  }

  loadValue(item: any): void {
    this.defaultItem = item[this.columnDef.field];
    this.setValue(this.defaultItem);
  }

  serializeValue(): Assignee | undefined {
    return this.selectedItem;
  }

  applyValue(item: any, state: Assignee | undefined): void {
    item[this.columnDef.field] = state;
  }

  isValueChanged(): boolean {
    return this.selectedItem?.id !== this.defaultItem?.id;
  }

  validate(): EditorValidationResult {
    return this.validator?.(this.selectedItem, this.args) ?? { valid: true, msg: null };
  }

  save(): void {
    if (!this.validate().valid) {
      return;
    }
    if (this.args.grid.getOptions().autoCommitEdit) {
      this.args.grid.getEditorLock().commitCurrentEdit();
    } else {
      this.args.commitChanges();
    }
  }

  cancel(): void {
    this.args.cancelChanges();
  }

  focus(): void {
    this.component?.focus();
  }

  hide(): void {
    this.component?.hide();
  }

  show(): void {
    this.component?.show();
  }

  destroy(): void {
    if (this.component) {
      void unmount(this.component as any);
      this.component = undefined;
    }
  }
}
