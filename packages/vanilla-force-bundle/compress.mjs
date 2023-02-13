
import fs from 'fs';
import archiver from 'archiver';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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
