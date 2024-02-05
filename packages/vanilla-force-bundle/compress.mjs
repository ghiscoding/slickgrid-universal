
import fs from 'fs';
import archiver from 'archiver';
import { strToU8, zip, gzip, zlib, zlibSync } from 'fflate';
import { globSync } from 'glob';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import normalizePath from 'normalize-path';

const inputFolder1 = './dist/bundle';
const inputFolder2 = '../common/dist/styles';
const argv = yargs(hideBin(process.argv)).argv;
const outputFilename = argv.outputFilename || 'bundle';
const outputFolder = argv.outputFolder || './dist/';

const ext = 'zip';
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

const outputPathFilename = `${outputFolder}${outputFilename}.${ext}`;

archive.pipe(fs.createWriteStream(outputPathFilename));
archive.directory(inputFolder1, false);
archive.directory(inputFolder2, 'styles');
archive.file('package.json', { name: 'package.json' });
archive.finalize().then(() => {
  console.log(`Compressed input folders "${inputFolder1}" and "${inputFolder2}" to single output file "${outputPathFilename}"`);
  console.log(`File Location:: "${import.meta.url.replace(/\\/gi, '/')}/${outputPathFilename}"`);
  console.log(`File Size:: ${(fs.statSync(outputPathFilename).size / 1024).toFixed(2)}Kb`);
  console.log(`Processed Timestamp`, new Date().toLocaleString('en-CA'));
  console.log(`ALL DONE!!!`);
});

// All files from `dist/bundle`
const bundleFiles = globSync('./dist/bundle/**/*.*');
const files = [
  { name: 'slickgrid-vanilla-bundle.js', path: bundleFiles[0] },
  { name: 'package.json', path: './package.json' },
];

// All files from `common/dist/styles`
const styleFiles = globSync('../common/dist/styles/**/*.*');
styleFiles.forEach(file => {
  const [styleName] = file.match(/(styles.*)/gi) || [];
  files.push({ name: normalizePath(styleName), path: normalizePath(file) });
});

let left = files.length;
let zipObj = {}; // create an object tree of the zip folders/files structure
const fileToU8 = (file, cb) => cb(strToU8(fs.readFileSync(file.path)));

// Yet again, this is necessary for parallelization.
let processFile = (file) => {
  fileToU8(file, (buffer) => {
    zipObj[file.name] = buffer;

    if (!--left) {
      // use in synchronouse mode to perform execution in multiple thread
      zip(zipObj, {
        mem: 0,
        level: 9 // compression level
      }, function (err, out) {
        if (err) {
          console.log(err);
        } else {
          console.log('Length ', out.length);
          fs.writeFileSync(`${outputFolder}${outputFilename}2.zip`, out);
        }
      });
    }
  });
};

for (let file of files) {
  processFile(file);
}
