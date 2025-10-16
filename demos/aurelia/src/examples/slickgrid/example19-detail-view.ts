import type { SlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';
import { bindable } from 'aurelia';
import type { SlickDataView, SlickGrid } from 'aurelia-slickgrid';
import './example19-detail-view.scss';

interface Item {
  assignee: string;
  duration: Date;
  percentComplete: number;
  reporter: string;
  start: Date;
  finish: Date;
  effortDriven: boolean;
  title: string;
  rowId: number;
}

export class Example19DetailView {
  @bindable() model!: Item;

  // you also have access to the following objects (it must match the exact property names shown below)
  @bindable() addon!: SlickRowDetailView; // row detail addon instance
  @bindable() grid!: SlickGrid;
  @bindable() dataView!: SlickDataView;

  // you can also optionally use the Parent Component reference
  // NOTE that you MUST provide it through the "parentRef" property in your "rowDetail" grid options
  @bindable() parentRef?: any;

  alertAssignee(name: string) {
    if (typeof name === 'string') {
      alert(`Assignee on this task is: ${name.toUpperCase()}`);
    } else {
      alert('No one is assigned to this task.');
    }
  }

  deleteRow(model: any) {
    if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
      // you first need to collapse all rows (via the 3rd party addon instance)
      this.addon.collapseAll();

      // then you can delete the item from the dataView
      this.dataView.deleteItem(model.rowId);

      this.parentRef!.showFlashMessage(`Deleted row with ${model.title}`, 'danger');
    }
  }

  callParentMethod(model: any) {
    this.parentRef!.showFlashMessage(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
  }
}
