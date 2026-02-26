import { defineAsyncComponent } from 'vue';
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

import Example01 from '../components/Example01.vue';
import Example38 from '../components/Example38.vue';
import Example39 from '../components/Example39.vue';
import Home from '../Home.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'root', redirect: '/example01' },
  { path: '/home', name: 'home', component: Home },
  { path: '/example01', name: '1- Basic Grid / 2 Grids', component: Example01 },
  { path: '/example02', name: '2- Formatters', component: defineAsyncComponent(() => import('../components/Example02.vue')) },
  { path: '/example03', name: '3- Editors / Delete', component: defineAsyncComponent(() => import('../components/Example03.vue')) },
  { path: '/example04', name: '4- Client Side Sort/Filter', component: defineAsyncComponent(() => import('../components/Example04.vue')) },
  { path: '/example05', name: '5- Backend OData Service', component: defineAsyncComponent(() => import('../components/Example05.vue')) },
  { path: '/example06', name: '6- Backend GraphQL Service', component: defineAsyncComponent(() => import('../components/Example06.vue')) },
  { path: '/example07', name: '7- Header Button Plugin', component: defineAsyncComponent(() => import('../components/Example07.vue')) },
  { path: '/example08', name: '8- Header Menu Plugin', component: defineAsyncComponent(() => import('../components/Example08.vue')) },
  { path: '/example09', name: '9- Grid Menu Control', component: defineAsyncComponent(() => import('../components/Example09.vue')) },
  { path: '/example10', name: '10- Row Selection / 2 Grids', component: defineAsyncComponent(() => import('../components/Example10.vue')) },
  { path: '/example11', name: '11- Add/Update Grid Item', component: defineAsyncComponent(() => import('../components/Example11.vue')) },
  { path: '/example12', name: '12- Localization (i18n)', component: defineAsyncComponent(() => import('../components/Example12.vue')) },
  { path: '/example13', name: '13- Grouping & Aggregators', component: defineAsyncComponent(() => import('../components/Example13.vue')) },
  { path: '/example14', name: '14- Column Span & Header Grouping', component: defineAsyncComponent(() => import('../components/Example14.vue')) },
  { path: '/example15', name: '15- Grid State & Local Storage', component: defineAsyncComponent(() => import('../components/Example15.vue')) },
  { path: '/example16', name: '16- Row Move Plugin', component: defineAsyncComponent(() => import('../components/Example16.vue')) },
  { path: '/example17', name: '17- Create Grid from CSV', component: defineAsyncComponent(() => import('../components/Example17.vue')) },
  { path: '/example18', name: '18- Draggable Grouping', component: defineAsyncComponent(() => import('../components/Example18.vue')) },
  { path: '/example19', name: '19- Row Detail View', component: defineAsyncComponent(() => import('../components/Example19.vue')) },
  { path: '/example20', name: '20- Pinned Columns / Rows', component: defineAsyncComponent(() => import('../components/Example20.vue')) },
  { path: '/example21', name: '21- Grid AutoHeight (full height)', component: defineAsyncComponent(() => import('../components/Example21.vue')) },
  { path: '/example22', name: '22- with Bootstrap Tabs', component: defineAsyncComponent(() => import('../components/Example22.vue')) },
  { path: '/example23', name: '23- Filter by Range of Values', component: defineAsyncComponent(() => import('../components/Example23.vue')) },
  { path: '/example24', name: '24- Cell & Context Menu', component: defineAsyncComponent(() => import('../components/Example24.vue')) },
  { path: '/example25', name: '25- GraphQL without Pagination', component: defineAsyncComponent(() => import('../components/Example25.vue')) },
  { path: '/example26', name: '26- Use of Vue Components', component: defineAsyncComponent(() => import('../components/Example26.vue')) },
  { path: '/example27', name: '27- Tree Data (Parent/Child)', component: defineAsyncComponent(() => import('../components/Example27.vue')) },
  { path: '/example28', name: '28- Tree Data (Hierarchical set)', component: defineAsyncComponent(() => import('../components/Example28.vue')) },
  { path: '/example29', name: '29- Grid Header & Footer Slots', component: defineAsyncComponent(() => import('../components/Example29.vue')) },
  { path: '/example30', name: '30- Composite Editor Model', component: defineAsyncComponent(() => import('../components/Example30.vue')) },
  { path: '/example31', name: '31- Backend OData with RxJS', component: defineAsyncComponent(() => import('../components/Example31.vue')) },
  { path: '/example32', name: '32- Columns Resize by Content', component: defineAsyncComponent(() => import('../components/Example32.vue')) },
  { path: '/example33', name: '33- Regular & Custom Tooltip', component: defineAsyncComponent(() => import('../components/Example33.vue')) },
  { path: '/example34', name: '34- Real-Time Trading Platform', component: defineAsyncComponent(() => import('../components/Example34.vue')) },
  { path: '/example35', name: '35- Row Based Editing', component: defineAsyncComponent(() => import('../components/Example35.vue')) },
  { path: '/example36', name: '36- Excel Export Formulas', component: defineAsyncComponent(() => import('../components/Example36.vue')) },
  { path: '/example37', name: '37- Footer Totals Row', component: defineAsyncComponent(() => import('../components/Example37.vue')) },
  { path: '/example38', name: '38- Infinite Scroll with OData', component: Example38 }, // don't use lazy route for that one because of Cypress test flakiness
  { path: '/example39', name: '39- Infinite Scroll with GraphQL', component: Example39 }, // don't use lazy route for that one because of Cypress test flakiness
  { path: '/example40', name: '40- Infinite Scroll from JSON data', component: defineAsyncComponent(() => import('../components/Example40.vue')) },
  { path: '/example41', name: '41- Drag & Drop', component: defineAsyncComponent(() => import('../components/Example41.vue')) },
  { path: '/example42', name: '42- Custom Pagination', component: defineAsyncComponent(() => import('../components/Example42.vue')) },
  { path: '/example43', name: '43- Colspan/Rowspan (timesheets)', component: defineAsyncComponent(() => import('../components/Example43.vue')) },
  { path: '/example44', name: '44- Colspan/Rowspan (large data)', component: defineAsyncComponent(() => import('../components/Example44.vue')) },
  { path: '/example45', name: '45- Row Detail with inner Grid', component: defineAsyncComponent(() => import('../components/Example45.vue')) },
  { path: '/example46', name: '46- Tree Data with Lazy Loading', component: defineAsyncComponent(() => import('../components/Example46.vue')) },
  { path: '/example47', name: '47- Row Detail + Grouping', component: defineAsyncComponent(() => import('../components/Example47.vue')) },
  { path: '/example48', name: '48- Hybrid Selection Model', component: defineAsyncComponent(() => import('../components/Example48.vue')) },
  { path: '/example49', name: '49- Spreadsheet Drag-Fill', component: defineAsyncComponent(() => import('../components/Example49.vue')) },
  { path: '/example50', name: '50- Master/Detail Grids', component: defineAsyncComponent(() => import('../components/Example50.vue')) },
  { path: '/example51', name: '51- Menus with Slots', component: defineAsyncComponent(() => import('../components/Example51.vue')) },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
