// import all CSS required by Slickgrid-Universal
import 'multiple-select-adapted/src/multiple-select.css';
import 'flatpickr/dist/flatpickr.min.css';
import './styles.scss';

// import all other 3rd party libs required by Slickgrid-Universal
import 'jquery';
import 'jquery-ui-dist/jquery-ui';
import { Renderer } from './renderer';
import * as SlickerModule from '@slickgrid-universal/vanilla-bundle';
import { App } from './app';

class Main {
  app: App;
  constructor(private renderer: Renderer) { }

  loadApp() {
    this.app = this.renderer.loadViewModel(require('./app.ts'));
    this.renderer.loadView(require('./app.html'));
    this.app.attached();
  }
}

// Create main object and add handlers for it
const renderer = new Renderer(document.querySelector('[app=main]'));
const main = new Main(renderer);
main.loadApp();

// Quick and easy way to expose a global API that can hook to the Main object
// so that we can get to it from click and events and others.
// Yes, there are other ways but this gets the job done for this demo.
(<any>window).main = main;
(<any>window).Slicker = SlickerModule && SlickerModule.Slicker || SlickerModule;

