import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJsonSync, writeJsonSync } from '@gc-utils/fs-extra';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const processPath = join(__dirname, '../');
const projectRootPath = join(__dirname, '../../../'); // project root from current script location

const MONOREPO_NAME = '@slickgrid-universal';

/**
 * Main entry, this script will replace all workspace protocol
 * with current version from "package.json" root into "dist/package.json"
 */
(async function main() {
  const mainPkg = readJsonSync(join(processPath, 'package.json'));
  const distPkg = readJsonSync(join(processPath, 'dist', 'package.json'));
  const yamlPath = join(projectRootPath, 'pnpm-workspace.yaml');

  // replace all workspace protocol with current version from "package.json" root into "dist/package.json"
  console.log('-------------------------------------------------------------------------------------');
  console.log(`Angular-Slickgrid, replace dist version & all "workspace:*" protocol in "dist/package.json"`);

  console.log(`update "dist/package.json" to { "version": "${mainPkg.version}" }`);
  distPkg.version = mainPkg.version;

  // retrieve any pnpm Catalog values
  const { catalog = {}, catalogs = {} } = existsSync(yamlPath) ? parse(readFileSync(yamlPath, { encoding: 'utf8' }), 'utf8') : {};

  for (let [depName, depVersion] of Object.entries(distPkg.dependencies)) {
    // check if it's a `catalog:` protocol
    if (depVersion.startsWith('catalog:')) {
      distPkg.dependencies[depName] = catalog[depName] || catalogs[depVersion]?.[depName] || '';
      console.log(`resolve '${depVersion}'    → { "${depName}": "${distPkg.dependencies[depName]}" }`);
    }
    // otherwise check if it's a local `workspace:` protocol (if so, find associated local dep's version and replace it)
    else if (depName.startsWith(`${MONOREPO_NAME}/`) || depVersion.startsWith('workspace:')) {
      // we need to get each package version
      const depPkgName = depName.replace(MONOREPO_NAME, '');
      const depPkg = readJsonSync(join(processPath, '../../packages/', depPkgName, 'package.json'));
      console.log(`resolve '${depVersion}' → { "${depName}": "${depPkg.version}" }`);
      distPkg.dependencies[depName] = depPkg.version;
    }
  }
  writeJsonSync(resolve(processPath, 'dist', 'package.json'), distPkg, { spaces: 2 });
  console.log('-------------------------------------------------------------------------------------\n');

  process.exit();
})();
