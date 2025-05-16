import { dirname as pDirname, join as pJoin, resolve as pResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJSONSync, writeJsonSync } from './fs-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pDirname(__filename);
const projectRootPath = pJoin(__dirname, '../');

/**
 * Main entry, this script will replace all workspace protocol
 * with current version from "package.json" root into "dist/package.json"
 */
(async function main() {
  const mainPkg = readJSONSync(pJoin(projectRootPath, 'package.json'));
  const distPkg = readJSONSync(pJoin(projectRootPath, 'dist', 'package.json'));

  // replace all workspace protocol with current version from "package.json" root into "dist/package.json"
  console.log('-------------------------------------------------------------------------------------');
  console.log(`Angular-Slickgrid, replace dist version & all "workspace:*" protocol in "dist/package.json"`);

  console.log(`update "dist/package.json" to { "version": "${mainPkg.version}" }`);
  distPkg.version = mainPkg.version;

  for (let [depName, depVersion] of Object.entries(distPkg.dependencies)) {
    if (depName.startsWith('@slickgrid-universal/') || depVersion.startsWith('workspace:')) {
      // we need to get each package version
      const depPkgName = depName.replace('@slickgrid-universal', '');
      const depPkg = readJSONSync(pJoin(projectRootPath, '../../packages/', depPkgName, 'package.json'));
      console.log(`update dependency { "${depName}": "${depPkg.version}" }`);
      distPkg.dependencies[depName] = depPkg.version;
    }
  }
  writeJsonSync(pResolve(projectRootPath, 'dist', 'package.json'), distPkg, { spaces: 2 });
  console.log('-------------------------------------------------------------------------------------\n');

  process.exit();
})();
