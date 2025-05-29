import { strToU8, zip } from 'fflate';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import normalizePath from 'normalize-path';
import { globSync } from 'tinyglobby';

import { parseArgs } from 'node:util';

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
  files.push({ name: normalizePath(styleName), path: normalizePath(file) });
});

let zipObj = {}; // create an object tree of the zip folders/files structure
let left = files.length;
const fileToU8 = (file, cb) => cb(strToU8(readFileSync(file.path)));

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
