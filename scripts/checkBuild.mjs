import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    framework: { type: 'string', short: 'f' },
  },
});

// Specific mapping for frameworks to their corresponding library and plugin names
const frameworkMapping = {
  angular: { lib: 'angular-slickgrid', plugin: 'angular-row-detail-plugin' },
  aurelia: { lib: 'aurelia-slickgrid', plugin: 'aurelia-row-detail-plugin' },
  react: { lib: 'slickgrid-react', plugin: 'react-row-detail-plugin' },
  vue: { lib: 'slickgrid-vue', plugin: 'vue-row-detail-plugin' },
};

if (!values.framework || !frameworkMapping[values.framework]) {
  console.error('Please provide a valid framework name. Use --framework or -f (e.g., angular, react).');
  process.exit(1);
}

const framework = values.framework;
const libraryInfo = frameworkMapping[framework]; // Get the library and plugin names
const libraryPath = path.join(process.cwd(), 'frameworks', libraryInfo.lib);
const pluginPath = path.join(process.cwd(), 'frameworks-plugins', libraryInfo.plugin);

// Function to check and build
const checkAndBuild = async (directory, pathType) => {
  const distPath = path.join(directory, 'dist');

  if (fs.existsSync(distPath)) {
    console.log(`Build found in ${pathType}.`);
    return true;
  }

  console.error(`Build not found in ${pathType}. Running build command...`);

  const buildProcess = spawn('pnpm', ['run', 'build'], {
    cwd: directory,
    stdio: 'inherit',
    shell: true,
  });

  return new Promise((resolve) => {
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Build completed successfully in ${pathType}.`);
        resolve(true);
      } else {
        console.error(`Build failed in ${pathType} with exit code ${code}.`);
        resolve(false);
      }
    });
  });
};

(async () => {
  // Check library build
  const libraryCheck = await checkAndBuild(libraryPath, 'frameworks');
  // Check plugin build
  const pluginCheck = libraryCheck && (await checkAndBuild(pluginPath, 'frameworks-plugins'));

  if (libraryCheck && pluginCheck) {
    console.log(`Both builds are ready, process completed.`);
    // Call your watch command here
  } else {
    process.exit(1); // Exit with an error code if any build failed
  }
})();
