import type { Filter, FilterArguments, FilterCallback, OperatorType, SearchTerm, SlickGrid } from 'slickgrid-svelte';
import { mount, unmount } from 'svelte';
import AssigneeSelect from '../AssigneeSelect.svelte';
import type { Assignee } from './assignee.model.js';

interface AssigneeSelectInstance {
  setValue: (item: Assignee | undefined) => void;
}

/** A custom Svelte component mounted as a SlickGrid header filter. */
export class CustomSvelteComponentFilter implements Filter {
  columnDef!: FilterArguments['columnDef'];
  callback!: FilterCallback;
  grid!: SlickGrid;
  operator: OperatorType = 'EQ';
  searchTerms: SearchTerm[] = [];

  private component?: AssigneeSelectInstance;
  private selectedItem?: Assignee;

  init(args: FilterArguments): void {
    this.columnDef = args.columnDef;
    this.callback = args.callback;
    this.grid = args.grid;
    this.operator = args.operator ?? 'EQ';
    const collection = (this.columnDef.filter?.collection ?? []) as Assignee[];
    const initialId = this.columnDef.filter?.searchTerms?.[0];
    this.selectedItem = collection.find((item) => item.id === `${initialId ?? ''}`);
    this.component = mount(AssigneeSelect, {
      target: args.filterContainerElm,
      props: {
        collection,
        selectedItem: this.selectedItem,
        onSelectedItemChanged: (item: Assignee | undefined) => {
          this.selectedItem = item;
          this.searchTerms = item?.id ? [item.id] : [];
          this.callback(undefined, {
            columnDef: this.columnDef,
            operator: this.operator,
            searchTerms: this.searchTerms,
          });
        },
      },
    }) as unknown as AssigneeSelectInstance;
  }

  getValues(): SearchTerm[] {
    return this.searchTerms;
  }

  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType, triggerChange = false): void {
    const searchTerm = Array.isArray(values) ? values[0] : values;
    const collection = (this.columnDef.filter?.collection ?? []) as Assignee[];
    this.selectedItem = collection.find((item) => item.id === `${searchTerm ?? ''}`);
    this.searchTerms = this.selectedItem?.id ? [this.selectedItem.id] : [];
    this.operator = operator ?? this.operator;
    this.component?.setValue(this.selectedItem);
    if (triggerChange) {
      this.callback(undefined, { columnDef: this.columnDef, operator: this.operator, searchTerms: this.searchTerms });
    }
  }

  clear(shouldTriggerQuery = true): void {
    this.setValues([]);
    this.callback(undefined, {
      columnDef: this.columnDef,
      operator: this.operator,
      clearFilterTriggered: true,
      shouldTriggerQuery,
      searchTerms: [],
    });
  }

  destroy(): void {
    if (this.component) {
      void unmount(this.component as any);
      this.component = undefined;
    }
  }
}
