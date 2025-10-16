import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgLabelTemplateDirective, NgOptionTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { type SearchTerm } from '@slickgrid-universal/common';
import { Subject } from 'rxjs';

// the appendTo="body" (necessary for SlickGrid filter) requires the body to be position relative like so
// <body style="position: relative">
@Component({
  template: ` <ng-select
    class="custom no-style-select"
    [items]="collection"
    bindValue="id"
    bindLabel="name"
    appendTo="body"
    [clearable]="false"
    (change)="onChange($event)"
    [(ngModel)]="selectedIds"
    [multiple]="true"
  >
    <ng-template ng-label-tmp ng-option-tmp let-item="item">
      <span [title]="item?.name">{{ item?.name }}</span>
    </ng-template>
  </ng-select>`,
  imports: [NgSelectComponent, FormsModule, NgLabelTemplateDirective, NgOptionTemplateDirective],
})
export class FilterNgSelectComponent<T = any> {
  selectedIds = signal<SearchTerm[]>([]);
  selectedItems = signal<T[]>([]);
  collection?: any[]; // this will be filled by the collection of your column definition
  onItemChanged = new Subject<any>(); // object

  onChange(items: any) {
    this.selectedItems.set(items);
    this.onItemChanged.next(items);
  }
}
