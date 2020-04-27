import { Renderer } from './renderer';
import { AppRouting } from './app-routing';
import { RouterConfig } from './interfaces';

export class App {
  documentTitle = 'Slickgrid-Universal';
  defaultRouteName: string;
  stateBangChar: string;
  renderer: Renderer;
  appRouting: any;
  viewModelObj = {};
  // baseUrl = window.location.origin + document.querySelector('base')?.getAttribute('href') || '';
  baseUrl = window.location.origin + window.location.pathname;
  routerConfig: RouterConfig = {
    pushState: false,
    routes: []
  }

  constructor() {
    this.appRouting = new AppRouting(this.routerConfig);
    this.stateBangChar = this.routerConfig.pushState ? '/' : '#/';
    this.defaultRouteName = this.routerConfig.routes.find((map) => map.redirect)?.redirect || '';
    this.navbarHamburgerToggle();
  }

  attached() {
    this.renderer = new Renderer(document.querySelector('view-route'));
    const location = window.location;
    let route = this.routerConfig.pushState ? location.pathname.replace(this.stateBangChar, '') : location.hash.replace(this.stateBangChar, '');
    if (!route || route === '/') {
      route = this.defaultRouteName;
    }
    this.loadRoute(route);

    // re-render on browser history navigation change
    window.onpopstate = () => {
      const winLoc = window.location;
      const prevRoute = this.routerConfig.pushState ? winLoc.pathname.replace(this.stateBangChar, '') : winLoc.hash.replace(this.stateBangChar, '');
      this.loadRoute(prevRoute || this.defaultRouteName, false);
    };
  }

  disposeAll() {
    this.renderer.dispose();

    for (const vmKey of Object.keys(this.viewModelObj)) {
      const viewModel = this.viewModelObj[vmKey];
      if (viewModel && viewModel.dispose) {
        viewModel.dispose();
        delete window[vmKey];
        delete this.viewModelObj[vmKey];
      }
    }
  }

  loadRoute(routeName: string, changeBrowserState = true) {
    this.disposeAll(); // dispose all previous ViewModel before creating any new one

    if (this.renderer && routeName) {
      const mapRoute = this.routerConfig.routes.find((map) => map.route === routeName);
      if (!mapRoute && this.defaultRouteName !== '') {
        this.loadRoute(this.defaultRouteName);
        return;
      }
      const viewModel = this.renderer.loadViewModel(require(`${mapRoute.moduleId}.ts`));
      if (viewModel && viewModel.dispose) {
        window.onunload = viewModel.dispose; // dispose when leaving SPA
      }

      this.renderer.loadView(require(`${mapRoute.moduleId}.html`));
      if (viewModel && viewModel.attached && this.renderer.className) {
        this.viewModelObj[this.renderer.className] = viewModel;
        viewModel.attached();
      }

      // change browser's history state & title
      if (changeBrowserState) {
        window.history.pushState({}, routeName, `${this.baseUrl}${this.stateBangChar}${routeName}`);
      }
      document.title = `${this.documentTitle} · ${mapRoute.name}`;
    }
  }

  /** Add event listener for the navbar hamburger menu toggle when menu shows up on mobile */
  navbarHamburgerToggle() {
    document.addEventListener('DOMContentLoaded', () => {

      // Get all "navbar-burger" elements
      const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

      // Check if there are any navbar burgers
      if ($navbarBurgers.length > 0) {
        // Add a click event on each of them
        $navbarBurgers.forEach(el => {
          el.addEventListener('click', () => {

            // Get the target from the "data-target" attribute
            const target = el.dataset.target;
            const $target = document.getElementById(target);

            // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');
          });
        });
      }
    });
  }
}
