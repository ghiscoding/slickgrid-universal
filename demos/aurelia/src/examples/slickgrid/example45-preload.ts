import { customElement } from 'aurelia';

@customElement({
  name: 'example45-preload',
  template: `<div class="container-fluid d-flex align-items-center" style="margin-top: 10px">
    <i class="mdi mdi-sync mdi-spin mdi-50px"></i>
    <h4>Loading...</h4>
  </div>`
})
export class Example45Preload {
  dispose() {
    console.log('preload detaching');
  }
}
