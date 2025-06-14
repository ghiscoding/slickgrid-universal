import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { readJsonSync, writeJsonSync } from '@gc-utils/fs-extra';
import { parse } from 'yaml';

const cwd = process.cwd();
const projectRootPath = join(cwd, '../../'); // project root from current script location

const MONOREPO_NAMESPACE = '@slickgrid-universal';

/**
 * Main entry, this script will replace all `catalog:` and `workspace:` protocols
 * with current version from "package.json" package root into "dist/package.json"
 */
(async function main() {
  const mainPkg = readJsonSync(join(cwd, 'package.json'));
  const distPkg = readJsonSync(join(cwd, 'dist', 'package.json'));
  const yamlPath = join(projectRootPath, 'pnpm-workspace.yaml');

  // replace all workspace protocol with current version from "package.json" root into "dist/package.json"
  console.log('-------------------------------------------------------------------------------------');
  console.log(`Angular-Slickgrid, replace dist version & all "workspace:*" protocol in "dist/package.json"`);

  console.log(`update "dist/package.json" to { "version": "${mainPkg.version}" }`);
  distPkg.version = mainPkg.version;

  // retrieve any pnpm Catalog values
  const { catalog = {}, catalogs = {} } = existsSync(yamlPath) ? parse(readFileSync(yamlPath, 'utf8')) : {};

  for (let [depName, depVersion] of Object.entries(distPkg.dependencies)) {
    // check if it's a `catalog:` protocol
    if (depVersion.startsWith('catalog:')) {
      distPkg.dependencies[depName] = catalog[depName] || catalogs[depVersion]?.[depName] || '';
      console.log(`transformed '${depVersion}'    → { "${depName}": "${distPkg.dependencies[depName]}" }`);
    }
    // otherwise check if it's a local `workspace:` protocol (if so, find associated local dep's version and replace it)
    else if (depName.startsWith(`${MONOREPO_NAMESPACE}/`) || depVersion.startsWith('workspace:')) {
      // we need to get each package version
      const depPkgName = depName.replace(MONOREPO_NAMESPACE, '');
      const depPkg = readJsonSync(join(cwd, '../../packages/', depPkgName, 'package.json'));

      // extra workspace: details, accepts: `workspace:[*~^]` or `workspace:[*~^]1.5.2`
      const [_, _wsTxt, rangePrefix, semver] = depVersion.match(/^(workspace:)?([*~^])?(.*)$/) || [];
      const versionPrefix = rangePrefix === '*' ? '' : rangePrefix;
      const finalVersion = semver ? `${versionPrefix}${semver}` : `${versionPrefix}${depPkg.version}`;
      distPkg.dependencies[depName] = finalVersion;
      console.log(`transformed '${depVersion}' → { "${depName}": "${finalVersion}" }`);
    }
  }
  writeJsonSync(resolve(cwd, 'dist', 'package.json'), distPkg, { spaces: 2 });
  console.log('-------------------------------------------------------------------------------------\n');

  process.exit();
})();
