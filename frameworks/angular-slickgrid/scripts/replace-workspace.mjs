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
  const rootPkg = readJSONSync(pJoin(projectRootPath, 'package.json'));
  const distPkg = readJSONSync(pJoin(projectRootPath, 'dist', 'package.json'));
  const currentVersion = rootPkg.version;

  // replace all workspace protocol with current version from "package.json" root into "dist/package.json"
  console.log('-------------------------------------------------------------------------------------');
  console.log(`- Angular-Slickgrid, replace all "workspace:*" with "${currentVersion}" in "dist/package.json"`);
  for (let [depName, depVersion] of Object.entries(distPkg.dependencies)) {
    if (depVersion.startsWith('workspace:*')) {
      distPkg.dependencies[depName] = currentVersion;
    }
  }
  writeJsonSync(pResolve(projectRootPath, 'dist', 'package.json'), distPkg, { spaces: 2 });
  console.log('-------------------------------------------------------------------------------------\n');

  process.exit();
})();
