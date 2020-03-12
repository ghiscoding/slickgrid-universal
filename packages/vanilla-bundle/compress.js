
'use strict';

const fs = require('fs');
const archiver = require('archiver');
const argv = require('yargs').argv;
const inputFolder1 = './dist/bundle';
const inputFolder2 = '../common/dist/styles';
const outputFilename = argv.outputFilename || 'bundle';
const outputFolder = argv.outputFolder || './dist/';

let archive;

const ext = 'zip';
archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

const outputPathFilename = `${outputFolder}/${outputFilename}.${ext}`;

archive.pipe(fs.createWriteStream(outputPathFilename));
archive.directory(inputFolder1, false);
archive.directory(inputFolder2, 'styles');
archive.finalize();

console.log(`Compressing input folder "${inputFolder1}" and "${inputFolder2}" to output folder ${outputPathFilename}`);
console.log(`ALL DONE!!!`);
