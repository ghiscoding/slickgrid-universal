import 'jsdom-global/register';
import Sortable from 'sortablejs';
import 'whatwg-fetch';

// (global as any).Storage = window.localStorage;
(global as any).navigator = { userAgent: 'node.js' };
(global as any).Slick = (window as any).Slick = {};
(global as any).Sortable = (window as any).Sortable = Sortable;
