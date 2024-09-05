import 'jsdom-global/register';
import * as matchers from 'jest-extended';
// import { toBeArray, toBeDate, toBeFunction, toContainEntry, toInclude, toBeObject, toBeString } from 'jest-extended';
import { expect } from 'vitest';
import 'whatwg-fetch';

// (global as any).Storage = window.localStorage;
(global as any).navigator = { userAgent: 'node.js' };

expect.extend(matchers);
// expect.extend({ toBeArray, toBeDate, toBeFunction, toContainEntry, toInclude, toBeObject, toBeString });