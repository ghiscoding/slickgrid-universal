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

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on('window:before:load', function (window) {
  const original = window.EventTarget.prototype.addEventListener;

  window.EventTarget.prototype.addEventListener = function () {
    if (arguments && arguments[0] === 'beforeunload') {
      return;
    }
    return original.apply(this, arguments);
  }

  Object.defineProperty(window, 'onbeforeunload', {
    get: function () { },
    set: function () { }
  });
});

Cypress.Cookies.defaults({
  preserve: 'serve-mode',
  set: 'cypress'
});