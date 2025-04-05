import { customElement } from 'aurelia';

@customElement({
  name: 'example19-preload',
  template: `<div class="container-fluid d-flex align-items-center" style="margin-top: 10px">
    <i class="mdi mdi-sync mdi-spin mdi-50px"></i>
    <h4>Loading...</h4>
  </div>`
})
export class Example19Preload {
  dispose() {
    console.log('preload detaching');
  }
}
