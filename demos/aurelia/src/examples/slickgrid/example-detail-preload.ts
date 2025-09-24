import { customElement } from 'aurelia';

@customElement({
  name: 'example-detail-preload',
  template: `<div class="container-fluid d-flex align-items-center" style="margin-top: 10px">
    <i class="mdi mdi-sync mdi-spin font-50px"></i>
    <h4>Loading...</h4>
  </div>`,
})
export class ExampleDetailPreload {
  dispose() {
    console.log('preload detaching');
  }
}
