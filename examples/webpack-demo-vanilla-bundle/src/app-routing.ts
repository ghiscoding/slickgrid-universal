import { RouterConfig } from './interfaces';

export class AppRouting {
  constructor(config: RouterConfig) {
    config.pushState = false;
    config.routes = [
      { route: 'example01', name: 'example01', title: 'Example01', moduleId: './examples/example01' },
      { route: 'example02', name: 'example02', title: 'Example02', moduleId: './examples/example02' },
      { route: 'example03', name: 'example03', title: 'Example03', moduleId: './examples/example03' },
      { route: 'example04', name: 'example04', title: 'Example04', moduleId: './examples/example04' },
      { route: 'example05', name: 'example05', title: 'Example05', moduleId: './examples/example05' },
      { route: 'example06', name: 'example06', title: 'Example06', moduleId: './examples/example06' },
      { route: 'example07', name: 'example07', title: 'Example07', moduleId: './examples/example07' },
      { route: 'example08', name: 'example08', title: 'Example08', moduleId: './examples/example08' },
      { route: 'example09', name: 'example09', title: 'Example09', moduleId: './examples/example09' },
      { route: 'example10', name: 'example10', title: 'Example10', moduleId: './examples/example10' },
      { route: 'example11', name: 'example11', title: 'Example11', moduleId: './examples/example11' },
      { route: 'example12', name: 'example12', title: 'Example12', moduleId: './examples/example12' },
      { route: 'example13', name: 'example13', title: 'Example13', moduleId: './examples/example13' },
      { route: 'example14', name: 'example14', title: 'Example14', moduleId: './examples/example14' },
      { route: 'example15', name: 'example15', title: 'Example15', moduleId: './examples/example15' },
      { route: 'example16', name: 'example16', title: 'Example16', moduleId: './examples/example16' },
      { route: 'example17', name: 'example17', title: 'Example17', moduleId: './examples/example17' },
      { route: 'example18', name: 'example18', title: 'Example18', moduleId: './examples/example18' },
      { route: 'icons', name: 'icons', title: 'icons', moduleId: './examples/icons' },
      { route: '', redirect: 'example01' },
      { route: '**', redirect: 'example01' }
    ];
  }
}
