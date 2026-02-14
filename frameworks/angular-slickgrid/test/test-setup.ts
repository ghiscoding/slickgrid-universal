// experimental Vitest Angular support following this article:
// https://dev.to/imasserano/how-to-use-angular-20-experimental-vitest-support-outside-of-ng-test-2i66

import { ɵgetCleanupHook as getCleanupHook, getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { afterEach, beforeEach } from 'vitest';

beforeEach(getCleanupHook(false));
afterEach(getCleanupHook(true));

export class TestModule {}

getTestBed().initTestEnvironment([BrowserTestingModule], platformBrowserTesting(), {
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
