/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// cypress/plugins/index.js
module.exports = (on, config) => {
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.name === 'chrome' && browser.isHeadless) {
      // fullPage screenshot size is 1000x950 on non-retina screens
      // and 2800x2400 on retina screens
      launchOptions.args.push('--window-size=1000,950')

      // force screen to be non-retina (1000x950 size)
      launchOptions.args.push('--force-device-scale-factor=1')

      // force screen to be retina (2800x2400 size)
      // launchOptions.args.push('--force-device-scale-factor=2')
    }

    if (browser.name === 'electron' && browser.isHeadless) {
      // fullPage screenshot size is 1000x950
      launchOptions.preferences.width = 1000
      launchOptions.preferences.height = 950
    }

    if (browser.name === 'firefox' && browser.isHeadless) {
      // menubars take up height on the screen
      // so fullPage screenshot size is 1000x1126
      launchOptions.args.push('--width=1000')
      launchOptions.args.push('--height=950')
    }

    return launchOptions
  })
}
