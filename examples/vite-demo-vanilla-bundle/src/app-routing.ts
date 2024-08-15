import type { RouterConfig } from './interfaces';

import Icons from './examples/icons';
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
import Example19 from './examples/example19';
import Example20 from './examples/example20';
import Example21 from './examples/example21';
import Example22 from './examples/example22';
import Example23 from './examples/example23';
import Example24 from './examples/example24';
import Example25 from './examples/example25';
import Example26 from './examples/example26';
import Example27 from './examples/example27';
import Example28 from './examples/example28';
import Example29 from './examples/example29';

export class AppRouting {
  constructor(private config: RouterConfig) {
    config.pushState = false;
    config.routes = [
      { route: 'icons', name: 'icons', view: './examples/icons.html', viewModel: Icons, title: 'icons', },
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
      { route: 'example19', name: 'example19', view: './examples/example19.html', viewModel: Example19, title: 'Example19', },
      { route: 'example20', name: 'example20', view: './examples/example20.html', viewModel: Example20, title: 'Example20', },
      { route: 'example21', name: 'example21', view: './examples/example21.html', viewModel: Example21, title: 'Example21', },
      { route: 'example22', name: 'example22', view: './examples/example22.html', viewModel: Example22, title: 'Example22', },
      { route: 'example23', name: 'example23', view: './examples/example23.html', viewModel: Example23, title: 'Example23', },
      { route: 'example24', name: 'example24', view: './examples/example24.html', viewModel: Example24, title: 'Example24', },
      { route: 'example25', name: 'example25', view: './examples/example25.html', viewModel: Example25, title: 'Example25', },
      { route: 'example26', name: 'example26', view: './examples/example26.html', viewModel: Example26, title: 'Example26', },
      { route: 'example27', name: 'example27', view: './examples/example27.html', viewModel: Example27, title: 'Example27', },
      { route: 'example28', name: 'example28', view: './examples/example28.html', viewModel: Example28, title: 'Example28', },
      { route: 'example29', name: 'example29', view: './examples/example29.html', viewModel: Example29, title: 'Example29', },
      { route: '', redirect: 'example01' },
      { route: '**', redirect: 'example01' }
    ];
  }

  getRoutes() {
    return this.config.routes;
  }
}
