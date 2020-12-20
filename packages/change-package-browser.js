'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const path = require('path');
const repoFolderName = argv.folderName || '';
const repoFolder = path.resolve(__dirname, repoFolderName);

// add/remove "browser" prop from package.json
if (argv.addBrowser) {
  console.log('add browser')
  addBrowserProp();
} else if (argv.removeBrowser) {
  console.log('remove browser')
  removeBrowserProp();
}

function addBrowserProp() {
  try {
    const data = fs.readFileSync(`${repoFolder}/package.json`, 'utf8');
    let pkg = JSON.parse(data);

    // add the "browser" property at specific position, right after the "main" property
    let updatedPkg = {};
    for (const prop of Object.keys(pkg)) {
      updatedPkg[prop] = pkg[prop];
      if (prop === 'main') {
        updatedPkg.browser = 'src/index.ts';
      }
    }

    fs.writeFileSync(`${repoFolder}/package.json`, JSON.stringify(updatedPkg, null, 2), 'utf8');
    console.log(`Successfully added "browser" property from common/package.json`);
  } catch (err) {
    console.log(`Error reading/writing file: ${err}`);
  }
}

function removeBrowserProp() {
  try {
    const data = fs.readFileSync(`${repoFolder}/package.json`, 'utf8');
    const pkg = JSON.parse(data);
    delete pkg.browser;

    fs.writeFileSync(`${repoFolder}/package.json`, JSON.stringify(pkg, null, 2), 'utf8');
    console.log(`Successfully removed "browser" property from common/package.json`);
  } catch (err) {
    console.log(`Error reading/writing file: ${err}`);
  }
}
