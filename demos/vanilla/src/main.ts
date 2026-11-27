import AppView from './app.html?raw';
import { App } from './app.js';
import { Renderer } from './renderer.js';
import { TranslateService } from './translate.service.js';
import './styles.scss';

class Main {
  app!: App;
  constructor(private renderer: Renderer) {}

  async loadApp() {
    this.app = this.renderer.loadViewModel(App);
    this.renderer.loadView(AppView);

    const translate = new TranslateService();
    translate.setup({
      loadPath: 'i18n/{{lang}}.json',
      lang: 'en',
    });
    await translate.use('en');

    // it might be better to use proper Dependency Injection
    // but for now let's use the window object to save keep a reference to our instantiated service
    (<any>window).TranslateService = translate;

    // finally attached (render) the app
    this.app.attached();
  }
}

const renderer = new Renderer(document.querySelector('#app') as HTMLDivElement);
new Main(renderer).loadApp();
