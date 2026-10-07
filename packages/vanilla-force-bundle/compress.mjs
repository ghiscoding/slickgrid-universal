import { existsSync, globSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { strToU8, zip } from 'fflate';
import normalizePath from 'normalize-path';

const inputFolder1 = './dist/bundle';
const inputFolder2 = '../common/dist/styles';

const { values: args } = parseArgs({
  options: {
    outputFilename: { type: 'string' },
    outputFolder: { type: 'string' },
    'output-filename': { type: 'string' },
    'output-folder': { type: 'string' },
  },
  allowPositionals: true,
});

// Prefer kebab-case if provided, otherwise camelCase, otherwise default
const outputFilename = args['output-filename'] || args.outputFilename || 'bundle';
const outputFolder = args['output-folder'] || args.outputFolder || './dist/';

if (!existsSync(outputFolder)) {
  mkdirSync(outputFolder);
}

// get all files from `dist/bundle`
const bundleFiles = globSync('./dist/bundle/**/*.*');
const files = [
  { name: 'slickgrid-vanilla-bundle.js', path: bundleFiles[0] },
  { name: 'package.json', path: './package.json' },
];

// get all files from `common/dist/styles`
const styleFiles = globSync('../common/dist/styles/**/*.*');
styleFiles.forEach((file) => {
  const [styleName] = file.match(/(styles.*)/gi) || [];
  files.push({ name: normalizePath(styleName), path: normalizePath(file), content: getThemeCssWithOptionalStyles(file) });
});

/** the bundle includes optional packages, so their styling must also be part of every theme CSS file */
function getThemeCssWithOptionalStyles(file) {
  const [, theme] = normalizePath(file).match(/css\/slickgrid-theme-(\w+)(?:\.lite)?\.css$/) || [];
  if (theme) {
    const themeCss = readFileSync(file, 'utf8');
    const optionalCss = [
      `../composite-editor-component/dist/styles/css/slick-composite-editor-${theme}.css`,
      `../custom-tooltip-plugin/dist/styles/css/slick-custom-tooltip-${theme}.css`,
    ]
      .map((cssFile) => readFileSync(cssFile, 'utf8'))
      .join('\n');

    // insert next to the editors styling (where it was before) so that zip compression can reuse similar rules
    const insertIdx = themeCss.indexOf('li.hidden{');
    return insertIdx >= 0 ? `${themeCss.slice(0, insertIdx)}${optionalCss}\n${themeCss.slice(insertIdx)}` : `${themeCss}\n${optionalCss}`;
  }
}

let zipObj = {}; // create an object tree of the zip folders/files structure
let left = files.length;
const fileToU8 = (file, cb) => cb(strToU8(file.content ?? readFileSync(file.path)));

// Yet again, this is necessary for parallelization.
let processFile = (file) => {
  fileToU8(file, (buffer) => {
    zipObj[file.name] = buffer;

    if (!--left) {
      // use in fflate zip (sync mode) to take full advantage of Web Workers
      // compress to level 9 (highest)
      zip(zipObj, { level: 9 }, (err, out) => {
        if (err) {
          console.error(err);
        } else {
          const outputPathFilename = `${outputFolder}${outputFilename}.zip`;
          writeFileSync(outputPathFilename, out);

          console.log(`Compressed input folders "${inputFolder1}" and "${inputFolder2}" to single output file "${outputPathFilename}"`);
          console.log(`File Location:: "${import.meta.url.replace(/\\/gi, '/')}/${outputPathFilename}"`);
          console.log(`File Size:: ${(statSync(outputPathFilename).size / 1024).toFixed(2)}Kb`);
          console.log(`Processed Timestamp`, new Date().toLocaleString('en-CA'));
          console.log(`ALL DONE!!!`);
        }
      });
    }
  });
};

for (let file of files) {
  processFile(file);
}
