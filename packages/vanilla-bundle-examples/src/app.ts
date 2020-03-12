import { Renderer } from './renderer';

export class App {
  renderer: Renderer;

  attached() {
    this.renderer = new Renderer(document.querySelector('view-route'));
    this.loadRoute('example01');
  }

  loadRoute(routeName: string) {
    let viewModel;

    if (this.renderer) {
      switch (routeName) {
        case 'example02':
          viewModel = this.renderer.loadViewModel(require('./examples/example02.ts'));
          this.renderer.loadView(require('./examples/example02.html'));
          viewModel.attached();
          break;
        case 'example01':
        default:
          viewModel = this.renderer.loadViewModel(require('./examples/example01.ts'));
          this.renderer.loadView(require('./examples/example01.html'));
          viewModel.attached();
          break;
      }
    }
  }
}
