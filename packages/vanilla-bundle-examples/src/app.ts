import { Renderer } from './renderer';
import { AppRouting } from './app-routing';
import { RouterConfig } from './interfaces';


export class App {
  documentTitle = 'Slickgrid-Universal';
  defaultRouteName: string;
  stateBangChar: string;
  renderer: Renderer;
  appRouting: any;
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
    const route = window.location.pathname.replace(this.stateBangChar, '') || this.defaultRouteName;
    this.loadRoute(route);

    // re-render on browser history navigation change
    window.onpopstate = () => this.loadRoute(window.location.pathname.replace(this.stateBangChar, ''), false);
  }

  loadRoute(routeName: string, changeBrowserState = true) {
    if (this.renderer && routeName) {
      const mapRoute = this.routerConfig.routes.find((map) => map.route === routeName);
      if (!mapRoute && this.defaultRouteName !== '') {
        this.loadRoute(this.defaultRouteName);
        return;
      }
      const viewModel = this.renderer.loadViewModel(require(`${mapRoute.moduleId}.ts`));
      this.renderer.loadView(require(`${mapRoute.moduleId}.html`));
      viewModel.attached();

      // change browser's history state & title
      if (changeBrowserState) {
        window.history.pushState({}, routeName, `${window.location.origin}${this.stateBangChar}${routeName}`);
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
