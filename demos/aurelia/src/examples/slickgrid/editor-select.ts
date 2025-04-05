import { bindable, resolve } from 'aurelia';
import type { SlickGrid } from 'aurelia-slickgrid';

export class EditorSelect {
  @bindable() model!: {
    collection: any[]; // this will be filled by the collection of your column definition
  };
  @bindable() grid!: SlickGrid;
  @bindable selectedItem: any;

  itemMatcher = (a: any, b: any) => a && b && a.id === b.id;

  constructor(private elm: HTMLElement = resolve(HTMLElement)) { }

  focus() {
    this.elm.querySelector('select')?.focus();
  }

  hide() {
    this.elm.style.display = 'none';
  }

  show() {
    this.elm.style.display = 'block';
  }

  // we need to define the method, it can be empty so that we can override it
  // inside the `custom-aureliaViewModelEditor()` method
  selectedItemChanged() { }
}
