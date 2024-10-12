// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// eslint-disable-next-line n/file-extension-in-import
import './commands';

Cypress.on('window:before:load', function (window) {
  const original = window.EventTarget.prototype.addEventListener;

  window.EventTarget.prototype.addEventListener = function () {
    // eslint-disable-next-line prefer-rest-params
    if (arguments?.[0] === 'beforeunload') {
      return;
    }
    // eslint-disable-next-line prefer-rest-params
    return original.apply(this, arguments);
  };

  Object.defineProperty(window, 'onbeforeunload', {
    get: () => { },
    set: () => { }
  });
});

// Cypress.Cookies.defaults({
//   preserve: 'serve-mode',
//   set: 'cypress'
// });