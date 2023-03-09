import 'jquery';
import './jQuery'; // define jQuery on the global window to make it available in Vite since @rollup/plugin-inject causes conflict with SASS variables prefixed with $var

// import all CSS required by Slickgrid-Universal
import 'flatpickr/dist/flatpickr.min.css';
import './styles.scss';

import { Renderer } from './renderer';
import * as SlickerModule from '@slickgrid-universal/vanilla-bundle';
import { App } from './app';
import AppView from './app.html?raw';
import { TranslateService } from './translate.service';

// load necessary Flatpickr Locale(s), but make sure it's imported AFTER the SlickerModule import
import 'flatpickr/dist/l10n/fr';

class Main {
  app!: App;
  constructor(private renderer: Renderer) { }

  async loadApp() {
    // this.app = new App();
    // this.app.loadRoute()
    // console.log(App, await import(`./app.ts` as any))
    this.app = this.renderer.loadViewModel(App);
    // this.app = this.renderer.loadViewModel(await import(`./app.ts` as any));
    this.renderer.loadView(AppView);

    const translate = new TranslateService();
    translate.setup({
      loadPath: 'i18n/{{lang}}.json',
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
const renderer = new Renderer(document.querySelector('#app') as HTMLDivElement);
const main = new Main(renderer);
main.loadApp();

// Quick and easy way to expose a global API that can hook to the Main object
// so that we can get to it from click and events and others.
// Yes, there are other ways but this gets the job done for this demo.
(<any>window).main = main;
(<any>window).Slicker = SlickerModule?.Slicker ?? SlickerModule;
