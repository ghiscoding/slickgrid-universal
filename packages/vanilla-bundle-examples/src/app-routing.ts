import { RouterConfig } from './interfaces';

export class AppRouting {
  constructor(config: RouterConfig) {
    config.pushState = true;
    config.routes = [
      { route: 'example01', name: 'example01', title: 'Example01', moduleId: './examples/example01' },
      { route: 'example02', name: 'example02', title: 'Example02', moduleId: './examples/example02' },
      { route: 'example03', name: 'example03', title: 'Example03', moduleId: './examples/example03' },
      { route: 'example04', name: 'example04', title: 'Example04', moduleId: './examples/example04' },
      { route: 'example05', name: 'example05', title: 'Example05', moduleId: './examples/example05' },
      { route: 'example50', name: 'example50', title: 'Example50', moduleId: './examples/example50' },
      { route: 'example51', name: 'example51', title: 'Example51', moduleId: './examples/example51' },
      { route: '', redirect: 'example01' },
      { route: '**', redirect: 'example01' }
    ];
  }
}
