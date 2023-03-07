import { RouterConfig } from './interfaces';

import Example01 from './examples/example01';
import Example02 from './examples/example02';
import Example03 from './examples/example03';
import Example04 from './examples/example04';
import Example05 from './examples/example05';
import Example06 from './examples/example06';
import Example07 from './examples/example07';
import Example08 from './examples/example08';
import Example09 from './examples/example09';
import Example10 from './examples/example10';
import Example11 from './examples/example11';
import Example12 from './examples/example12';
import Example13 from './examples/example13';
import Example14 from './examples/example14';
import Example15 from './examples/example15';
import Example16 from './examples/example16';
import Example17 from './examples/example17';
import Example18 from './examples/example18';

export class AppRouting {
  constructor(private config: RouterConfig) {
    config.pushState = false;
    config.routes = [
      { route: 'example01', name: 'example01', view: './examples/example01.html', viewModel: Example01, title: 'Example01', },
      { route: 'example02', name: 'example02', view: './examples/example02.html', viewModel: Example02, title: 'Example02', },
      { route: 'example03', name: 'example03', view: './examples/example03.html', viewModel: Example03, title: 'Example03', },
      { route: 'example04', name: 'example04', view: './examples/example04.html', viewModel: Example04, title: 'Example04', },
      { route: 'example05', name: 'example05', view: './examples/example05.html', viewModel: Example05, title: 'Example05', },
      { route: 'example06', name: 'example06', view: './examples/example06.html', viewModel: Example06, title: 'Example06', },
      { route: 'example07', name: 'example07', view: './examples/example07.html', viewModel: Example07, title: 'Example07', },
      { route: 'example08', name: 'example08', view: './examples/example08.html', viewModel: Example08, title: 'Example08', },
      { route: 'example09', name: 'example09', view: './examples/example09.html', viewModel: Example09, title: 'Example09', },
      { route: 'example10', name: 'example10', view: './examples/example10.html', viewModel: Example10, title: 'Example10', },
      { route: 'example11', name: 'example11', view: './examples/example11.html', viewModel: Example11, title: 'Example11', },
      { route: 'example12', name: 'example12', view: './examples/example12.html', viewModel: Example12, title: 'Example12', },
      { route: 'example13', name: 'example13', view: './examples/example13.html', viewModel: Example13, title: 'Example13', },
      { route: 'example14', name: 'example14', view: './examples/example14.html', viewModel: Example14, title: 'Example14', },
      { route: 'example15', name: 'example15', view: './examples/example15.html', viewModel: Example15, title: 'Example15', },
      { route: 'example16', name: 'example16', view: './examples/example16.html', viewModel: Example16, title: 'Example16', },
      { route: 'example17', name: 'example17', view: './examples/example17.html', viewModel: Example17, title: 'Example17', },
      { route: 'example18', name: 'example18', view: './examples/example18.html', viewModel: Example18, title: 'Example18', },
      { route: '', redirect: 'example01' },
      { route: '**', redirect: 'example01' }
    ];
  }

  getRoutes() {
    return this.config.routes;
  }
}
