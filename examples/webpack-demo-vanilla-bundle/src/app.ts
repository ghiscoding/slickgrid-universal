import { AppRouting } from './app-routing';
import { Renderer } from './renderer';
import { RouterConfig } from './interfaces';

interface ElementEventListener {
  element: Element;
  eventName: string;
  listener: EventListenerOrEventListenerObject;
}

export class App {
  private _boundedEventWithListeners: ElementEventListener[] = [];
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

    // GitHub logo with Stars shouldn't be created while testing in Cypress (which always wait few seconds even minutes to load the logo)
    // <a href="https://github.com/ghiscoding/slickgrid-universal"><img src="https://img.shields.io/github/stars/ghiscoding/slickgrid-universal?style=social"></a>
    const decodedCookie = decodeURIComponent(document.cookie);
    if (decodedCookie !== 'serve-mode=cypress') {
      const ghStarLinkElm = document.createElement('a');
      ghStarLinkElm.href = 'https://github.com/ghiscoding/slickgrid-universal';
      const imgStarElm = document.createElement('img');
      imgStarElm.src = 'https://img.shields.io/github/stars/ghiscoding/slickgrid-universal?style=social';
      const ghButtonContainerElm = document.querySelector('.github-button-container');
      if (ghButtonContainerElm && !ghButtonContainerElm.querySelector('a')) {
        ghStarLinkElm.appendChild(imgStarElm);
        ghButtonContainerElm.appendChild(ghStarLinkElm);
      }
    }

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

  addElementEventListener(element: Element, eventName: string, listener: EventListenerOrEventListenerObject) {
    element.addEventListener(eventName, listener);
    this._boundedEventWithListeners.push({ element, eventName, listener });
  }

  /** Dispose of the SPA App */
  disposeApp() {
    document.removeEventListener('DOMContentLoaded', this.handleNavbarHamburgerToggle);
  }

  /** Dispose of all View Models of the SPA */
  disposeAll() {
    this.unbindAllEvents();

    for (const vmKey of Object.keys(this.viewModelObj)) {
      const viewModel = this.viewModelObj[vmKey];
      if (viewModel?.dispose) {
        viewModel?.dispose();

        // also clear all of its variable references to avoid detached elements
        for (const ref of Object.keys(viewModel)) {
          viewModel[ref] = null;
        }
      }
      // nullify the object and then delete them to make sure it's picked by the garbage collector
      window[vmKey] = null;
      this.viewModelObj[vmKey] = null;
      delete window[vmKey];
      delete this.viewModelObj[vmKey];
    }
    this.renderer?.dispose();
  }

  loadRoute(routeName: string, changeBrowserState = true) {
    this.disposeAll(); // dispose all previous ViewModel & bindings before creating any new one

    if (this.renderer && routeName) {
      const mapRoute = this.routerConfig.routes.find((map) => map.route === routeName);
      if (!mapRoute && this.defaultRouteName !== '') {
        this.loadRoute(this.defaultRouteName);
        return;
      }
      const viewModel = this.renderer.loadViewModel(require(`${mapRoute.moduleId}.ts`));
      if (viewModel?.dispose) {
        window.onunload = () => {
          viewModel.dispose; // dispose when leaving SPA
          this.disposeApp();
        };
      }

      // then load the new View
      this.renderer.loadView(require(`${mapRoute.moduleId}.html`));
      if (viewModel?.attached && this.renderer.className) {
        this.viewModelObj[this.renderer.className] = viewModel;
        viewModel.attached();
        this.dropdownToggle(); // rebind bulma dropdown toggle event handlers
      }

      // change browser's history state & title
      if (changeBrowserState) {
        window.history.pushState({}, routeName, `${this.baseUrl}${this.stateBangChar}${routeName}`);
      }
      document.title = `${this.documentTitle} · ${mapRoute.name}`;
    }
  }

  /** bind bulma all dropdowns toggle event handlers */
  dropdownToggle() {
    const $dropdowns = document.querySelectorAll('.dropdown:not(.is-hoverable)');

    if ($dropdowns.length > 0) {
      $dropdowns.forEach($el => {
        this.addElementEventListener($el, 'click', (event) => {
          event.stopPropagation();
          $el.classList.toggle('is-active');
        });
      });

      this.addElementEventListener(document.body, 'click', this.closeDropdowns.bind(this));
    }
  }

  closeDropdowns() {
    const $dropdowns = document.querySelectorAll('.dropdown:not(.is-hoverable)');
    $dropdowns.forEach($el => $el.classList.remove('is-active'));
  }

  /** Add event listener for the navbar hamburger menu toggle when menu shows up on mobile */
  navbarHamburgerToggle() {
    document.addEventListener('DOMContentLoaded', this.handleNavbarHamburgerToggle);
  }

  handleNavbarHamburgerToggle() {
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
  }

  /** Unbind All (remove) bounded elements with listeners */
  unbindAllEvents() {
    for (const boundedEvent of this._boundedEventWithListeners) {
      const { element, eventName, listener } = boundedEvent;
      if (element?.removeEventListener) {
        element.removeEventListener(eventName, listener);
      }
    }
  }
}
