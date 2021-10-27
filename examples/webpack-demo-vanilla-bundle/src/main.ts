// import all CSS required by Slickgrid-Universal
import 'multiple-select-modified/src/multiple-select.css';
import 'flatpickr/dist/flatpickr.min.css';
import './styles.scss';

// import all other 3rd party libs required by Slickgrid-Universal
// also only import jQueryUI necessary widget (note autocomplete & slider are imported in their respective editors/filters)
import { Renderer } from './renderer';
import * as SlickerModule from '@slickgrid-universal/vanilla-bundle';
import { App } from './app';
import { TranslateService } from 'translate.service';

// load necessary Flatpickr Locale(s), but make sure it's imported AFTER the SlickerModule import
import 'flatpickr/dist/l10n/fr';

class Main {
  app: App;
  constructor(private renderer: Renderer) { }

  async loadApp() {
    this.app = this.renderer.loadViewModel(require('./app.ts'));
    this.renderer.loadView(require('./app.html'));

    const translate = new TranslateService();
    translate.setup({
      loadPath: 'assets/i18n/{{lang}}.json',
      lang: 'en'
    });
    await translate.use('en');

    // it might be better to use proper Dependency Injection
    // but for now let's use the window object to save keep a reference to our instantiated service
    (<any>window).TranslateService = translate;

    // finally attached (render) the app
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
