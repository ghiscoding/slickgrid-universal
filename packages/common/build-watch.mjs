import copyfiles from 'copyfiles';
import path from 'path';
// import sass from 'sass';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { exec, execSync } from 'child_process';

/**
 * Special script used by the Watch in Development which will compile TypeScript files with tsc incremental and/or SASS files when changes occurs.
 * The script takes a single argument `--files`, provided by `lerna watch`, which is a CSV string of the file(s) that changed (`.ts` and/or `.scss` files)
 *
 * This script simplifies the watch process of TypeScript & SASS files, prior to this script we had a few different watches to deal with TS changes and SASS changes.
 * So in summary, with this script we can now have a single `lerna watch` for all TypeScript & SASS file changes, it will recompile & copy SASS file to dist folder
 */
await run();

async function run() {
  console.log('Common build started.')
  const argv = yargs(hideBin(process.argv)).argv;
  const changedFiles = argv.files.split(',');

  if (changedFiles.some(f => f.includes('.ts'))) {
    console.log('TS files found!');
    execSync('npm run build:incremental', () => console.log('tsc incremental completed'));
  }
  if (changedFiles.some(f => f.includes('.scss'))) {
    console.log('SASS files found!');

    // for CSS we need to recompile all Slickgrid-Universal themes (except the bare/lite versions)
    await compileAllSassThemes();
    console.log('All styling themes compiled to CSS...\nProceeding with .scss files copy');

    // copy only the SASS file that changed
    for (const changedFile of changedFiles) {
      const fileWithExtension = path.basename(changedFile);
      const relativeFile = `src/styles/${fileWithExtension}`;
      copyfiles(
        [relativeFile, 'dist/styles/sass'],
        { up: true },
        (err) => { err ? console.error(err) : console.log(`Copied "${fileWithExtension}" to "dist/styles/sass"`) }
      );
    }
  }

  // for (const changedFile of changedFiles) {
  //   const extension = path.extname(changedFile);
  //   if (extension === '.ts') {
  //     exec('npm run sass-build-task:scss-compile:bootstrap');
  //   } else if (extension === '.scss') {
  //     const fileWithExtension = path.basename(changedFile);
  //     const filename = path.basename(changedFile, '.scss');
  //     const relativeFile = `src/styles/${fileWithExtension}`;
  //     // const compressed = sass.compile(relativeFile, { style: 'compressed', quietDeps: true, noSourceMap: true });
  //     // fs.writeFileSync(`dist/styles/css/${filename}.css`, compressed.css);

  //     // const themeFilenames = ['slickgrid-theme-bootstrap', 'slickgrid-theme-material', 'slickgrid-theme-salesforce'];
  //     // for (const themeFilename of themeFilenames) {
  //     //   fs.outputFileSync(
  //     //     `dist/styles/css/${themeFilename}.css`,
  //     //     sass.compile(`src/styles/${themeFilename}.scss`, { style: 'compressed', quietDeps: true, noSourceMap: true }).css
  //     //   );
  //     // }

  //     await compileAllSassThemes();
  //     console.log('All Slickgrid-Universal themes successfully compiled to CSS');

  //     copyfiles(
  //       [relativeFile, 'dist/styles/sass'],
  //       { up: true },
  //       (err) => { err ? console.error(err) : console.log(`Copied "${fileWithExtension}" to "dist/styles/sass"`) }
  //     );
  //   }
  // }
}

async function compileAllSassThemes() {
  // we can simply run the npm scripts in parallel that already exist
  await Promise.all([
    exec('npm run sass-build-task:scss-compile:bootstrap'),
    exec('npm run sass-build-task:scss-compile:material'),
    exec('npm run sass-build-task:scss-compile:salesforce'),
  ]);
}