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
  const distPkg = readJSONSync(pJoin(projectRootPath, 'dist', 'package.json'));

  // replace all workspace protocol with current version from "package.json" root into "dist/package.json"
  console.log('-------------------------------------------------------------------------------------');
  console.log(`Angular-Slickgrid, replace all "workspace:*" protocol in "dist/package.json"`);
  for (let [depName, depVersion] of Object.entries(distPkg.dependencies)) {
    if (depVersion.startsWith('workspace:*')) {
      // we need to get each package version
      const depPkgName = depName.replace('@slickgrid-universal', '');
      const depPkg = readJSONSync(pJoin(projectRootPath, '../../packages/', depPkgName, 'package.json'));
      distPkg.dependencies[depName] = depPkg.version;
      console.log(`replace "${depName}" dependency to "${depPkg.version}"`);
    }
  }
  writeJsonSync(pResolve(projectRootPath, 'dist', 'package.json'), distPkg, { spaces: 2 });
  console.log('-------------------------------------------------------------------------------------\n');

  process.exit();
})();
