import 'jsdom-global/register';
import Sortable from 'sortablejs';
import 'whatwg-fetch';
import * as jQuery from 'jquery';

(global as any).$ = (global as any).jQuery = jQuery;
(window as any).$ = (window as any).jQuery = jQuery;
// (global as any).Storage = window.localStorage;
(global as any).navigator = { userAgent: 'node.js' };
(global as any).Slick = (window as any).Slick = {};
(global as any).Sortable = (window as any).Sortable = Sortable;

require('slickgrid/slick.core');
require('slickgrid/slick.dataview');
require('slickgrid/slick.interactions');
require('slickgrid/slick.grid');
