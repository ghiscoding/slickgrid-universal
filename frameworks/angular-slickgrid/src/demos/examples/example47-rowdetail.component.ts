import { DecimalPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SlickDataView, SlickGrid } from '../../library';

import type { Example47Component } from './example47.component';
import { showToast } from './utilities';

interface ItemDetail {
  id: number;
  duration: Date;
  percentComplete: number;
  reporter: string;
  start: Date;
  finish: Date;
  effortDriven: boolean;
  assignee: string;
  title: string;
}

@Component({
  styles: ['.detail-label { display: inline-flex; align-items: center; gap: 4px; padding: 4px; }', 'label { font-weight: 600; }'],
  templateUrl: './example47-rowdetail.component.html',
  imports: [FormsModule, DecimalPipe, DatePipe],
})
export class Example47RowDetailComponent {
  model!: ItemDetail;

  // you also have access to the following objects (it must match the exact property names shown below)
  addon: any; // row detail addon instance
  grid!: SlickGrid;
  dataView!: SlickDataView;

  // you can also optionally use the Parent Component reference
  // NOTE that you MUST provide it through the "parentRef" property in your "rowDetail" grid options
  parentRef!: Example47Component;

  alertAssignee(name: string) {
    if (typeof name === 'string') {
      alert(`Assignee on this task is: ${name.toUpperCase()}`);
    } else {
      alert('No one is assigned to this task.');
    }
  }

  deleteRow(model: ItemDetail) {
    if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
      // you first need to collapse all rows (via the 3rd party addon instance)
      this.addon.collapseAll();

      // then you can delete the item from the dataView
      this.dataView.deleteItem(model.id);

      showToast(`Deleted row with ${model.title}`, 'danger');
    }
  }

  showNotification(model: ItemDetail) {
    showToast(`We just called Parent Method from the Row Detail Child Component on ${model.title}`, 'info');
  }
}
