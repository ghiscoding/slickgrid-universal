import { Renderer } from './renderer';

export class App {
  defaultModelName = 'example01';
  documentTitle = 'Slickgrid-Universal';
  stateBangChar = '/';
  renderer: Renderer;

  routing = [
    { route: 'example01', name: 'example01', title: 'Example01', moduleId: './examples/example01' },
    { route: 'example02', name: 'example02', title: 'Example02', moduleId: './examples/example02' },
    { route: 'example03', name: 'example03', title: 'Example03', moduleId: './examples/example03' },
    { route: 'example50', name: 'example50', title: 'Example50', moduleId: './examples/example50' },
    { route: 'example51', name: 'example51', title: 'Example51', moduleId: './examples/example51' },
  ]

  attached() {
    this.renderer = new Renderer(document.querySelector('view-route'));
    const route = window.location.pathname.replace(this.stateBangChar, '') || this.defaultModelName;
    this.loadRoute(route);

    // re-render on browser history navigation change
    window.onpopstate = () => this.loadRoute(window.location.pathname.replace(this.stateBangChar, ''), false);
  }

  loadRoute(routeName: string, changeBrowserState = true) {
    if (this.renderer && routeName) {
      const mapRoute = this.routing.find((map) => map.route === routeName);
      if (!mapRoute) {
        throw new Error('No Route found, make sure that you have an associated Route in your Routing before trying to use it');
      }
      const viewModel = this.renderer.loadViewModel(require(`${mapRoute.moduleId}.ts`));
      this.renderer.loadView(require(`${mapRoute.moduleId}.html`));
      viewModel.attached();

      // change browser's history state & title
      if (changeBrowserState) {
        window.history.pushState({}, routeName, `${window.location.origin}/${routeName}`);
      }
      document.title = `${this.documentTitle} · ${mapRoute.name}`;
    }
  }
}
