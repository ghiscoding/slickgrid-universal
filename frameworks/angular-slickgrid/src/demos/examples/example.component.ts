import { Component, signal } from '@angular/core';
import { AngularSlickgridComponent, GridOption } from '../../library';

@Component({
  selector: 'app-test-grid',
  imports: [AngularSlickgridComponent],
  template: `
    <div class="container-sm">
      <button class="btn btn-secondary mb-2" (click)="updateColumns()">Update columns</button>
      <angular-slickgrid gridId="g122" [options]="options" [columns]="columns()" [dataset]="rows()" />
    </div>
  `,
})
export class TestGridPageComponent {
  protected readonly options: GridOption = {
    gridWidth: '100%',
    enableCheckboxSelector: true,
  };

  protected readonly columns = signal([
    { id: 'id', name: 'id', field: 'id' },
    { id: 'name', name: 'name', field: 'name' },
    { id: 'nameShort', name: 'short', field: 'nameShort' },
  ]);

  protected readonly rows = signal([
    { id: 1, name: 'One dog', nameShort: 'one' },
    { id: 2, name: 'Two dogs', nameShort: 'two' },
  ]);

  protected updateColumns() {
    this.columns.update(() => [
      { id: 'id', name: 'id', field: 'id' },
      { id: 'name', name: 'name', field: 'name' },
    ]);
  }
}
