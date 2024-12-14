import { execAsyncPiped, spawnStreaming } from './child-process.mjs';

/**
 * Run `npm publish`
 * @param {String} [publishTagName] - optional publish tag (alpha, beta, ...)
 * @param {{ cwd: String, dryRun: Boolean}} options
 * @returns {Promise<any>}
 */
export function publishPackage(publishTagName, { cwd, otp, dryRun, stream }) {
  const execArgs = ['publish'];
  if (publishTagName) {
    execArgs.push('--tag', publishTagName);
  }
  if (otp) {
    execArgs.push('--otp', otp);
  }
  if (dryRun) {
    execArgs.push('--dry-run');
  }

  // pnpm will not allow you to make a publish if you have changes in the repository
  execArgs.push('--no-git-checks');

  if (stream) {
    return spawnStreaming('pnpm', execArgs, { cwd });
  }
  return execAsyncPiped('pnpm', execArgs, { cwd });
}

/**
 * @param {{ cwd: String, dryRun: Boolean}} options
 * @returns {Promise<any>}
 */
export function syncLockFile({ cwd, dryRun }) {
  return execAsyncPiped('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], { cwd }, dryRun);
}
