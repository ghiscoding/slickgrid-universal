import copyfiles from 'copyfiles';
import { exec } from 'node:child_process';
import { basename } from 'node:path';

/**
 * Special script used by the Watch in Development which will compile TypeScript files with tsc incremental and/or SASS files when changes occurs.
 * The script takes a single argument `--files`, provided by `lerna watch`, which is a CSV string of the file(s) that changed (`.ts` and/or `.scss` files)
 *
 * This script simplifies the watch process of TypeScript & SASS files, prior to this script we had a few different watches to deal with TS changes and SASS changes.
 * So in summary, with this script we can now have a single `lerna watch` for all TypeScript & SASS file changes, it will recompile & copy SASS file to dist folder
 */
await run();

async function run() {
  // get the file changed from Lerna watch from the environment variable since we are interested in these changes only in this script,
  // using .env var will avoid passing the changes to all packages npm scripts and avoid `tsc` complaining about unknown argument `--files`
  const changedFiles = process.env.LERNA_FILE_CHANGES.split(',');

  if (changedFiles.some(f => f.includes('.ts'))) {
    console.log('TypeScript file changes detected... start tsc incremental build');
    exec('npm run build:incremental', () => console.log('tsc incremental completed'));
  }
  if (changedFiles.some(f => f.includes('.scss'))) {
    console.log('SASS file changes detected... recompile to CSS');

    // for CSS we need to recompile all Slickgrid-Universal themes (except the bare/lite versions)
    await compileAllSassThemes();
    console.log('All styling themes compiled to CSS... Proceeding with .scss files copy');

    // copy only the SASS file that changed
    for (const changedFile of changedFiles) {
      const fileWithExtension = basename(changedFile);
      const relativeFile = `src/styles/${fileWithExtension}`;
      copyfiles(
        [relativeFile, 'dist/styles/sass'],
        { up: true },
        (err) => { err ? console.error(err) : console.log(`Copied "${fileWithExtension}" to "dist/styles/sass"`); }
      );
    }
  }
}

async function compileAllSassThemes() {
  // we can simply run the npm scripts in parallel that already exist
  await Promise.all([
    exec('npm run sass-build-task:scss-compile:bootstrap'),
    exec('npm run sass-build-task:scss-compile:material'),
    exec('npm run sass-build-task:scss-compile:salesforce'),
  ]);
}