import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

import Example1 from '../components/Example01.vue';
import Example2 from '../components/Example02.vue';
import Example3 from '../components/Example03.vue';
import Example4 from '../components/Example04.vue';
import Example5 from '../components/Example05.vue';
import Example6 from '../components/Example06.vue';
import Example7 from '../components/Example07.vue';
import Example8 from '../components/Example08.vue';
import Example9 from '../components/Example09.vue';
import Example10 from '../components/Example10.vue';
import Example11 from '../components/Example11.vue';
import Example12 from '../components/Example12.vue';
import Example13 from '../components/Example13.vue';
import Example14 from '../components/Example14.vue';
import Example15 from '../components/Example15.vue';
import Example16 from '../components/Example16.vue';
import Example17 from '../components/Example17.vue';
import Example18 from '../components/Example18.vue';
import Example19 from '../components/Example19.vue';
import Example20 from '../components/Example20.vue';
import Example21 from '../components/Example21.vue';
import Example22 from '../components/Example22.vue';
import Example23 from '../components/Example23.vue';
import Example24 from '../components/Example24.vue';
import Example25 from '../components/Example25.vue';
import Example26 from '../components/Example26.vue';
import Example27 from '../components/Example27.vue';
import Example28 from '../components/Example28.vue';
import Example29 from '../components/Example29.vue';
import Example30 from '../components/Example30.vue';
import Example31 from '../components/Example31.vue';
import Example32 from '../components/Example32.vue';
import Example33 from '../components/Example33.vue';
import Example34 from '../components/Example34.vue';
import Example35 from '../components/Example35.vue';
import Example36 from '../components/Example36.vue';
import Example37 from '../components/Example37.vue';
import Example38 from '../components/Example38.vue';
import Example39 from '../components/Example39.vue';
import Example40 from '../components/Example40.vue';
import Example41 from '../components/Example41.vue';
import Example42 from '../components/Example42.vue';
import Example43 from '../components/Example43.vue';
import Example44 from '../components/Example44.vue';
import Example45 from '../components/Example45.vue';
import Home from '../Home.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'root', redirect: '/example1' },
  { path: '/home', name: 'home', component: Home },
  { path: '/example1', name: '1- Basic Grid / 2 Grids', component: Example1 },
  { path: '/example2', name: '2- Formatters', component: Example2 },
  { path: '/example3', name: '3- Editors / Delete', component: Example3 },
  { path: '/example4', name: '4- Client Side Sort/Filter', component: Example4 },
  { path: '/example5', name: '5- Backend OData Service', component: Example5 },
  { path: '/example6', name: '6- Backend GraphQL Service', component: Example6 },
  { path: '/example7', name: '7- Header Button Plugin', component: Example7 },
  { path: '/example8', name: '8- Header Menu Plugin', component: Example8 },
  { path: '/example9', name: '9- Grid Menu Control', component: Example9 },
  { path: '/example10', name: '10- Row Selection / 2 Grids', component: Example10 },
  { path: '/example11', name: '11- Add/Update Grid Item', component: Example11 },
  { path: '/example12', name: '12- Localization (i18n)', component: Example12 },
  { path: '/example13', name: '13- Grouping & Aggregators', component: Example13 },
  { path: '/example14', name: '14- Column Span & Header Grouping', component: Example14 },
  { path: '/example15', name: '15- Grid State & Local Storage', component: Example15 },
  { path: '/example16', name: '16- Row Move Plugin', component: Example16 },
  { path: '/example17', name: '17- Create Grid from CSV', component: Example17 },
  { path: '/example18', name: '18- Draggable Grouping', component: Example18 },
  { path: '/example19', name: '19- Row Detail View', component: Example19 },
  { path: '/example20', name: '20- Pinned Columns / Rows', component: Example20 },
  { path: '/example21', name: '21- Grid AutoHeight (full height)', component: Example21 },
  { path: '/example22', name: '22- with Bootstrap Tabs', component: Example22 },
  { path: '/example23', name: '23- Filter by Range of Values', component: Example23 },
  { path: '/example24', name: '24- Cell & Context Menu', component: Example24 },
  { path: '/example25', name: '25- GraphQL without Pagination', component: Example25 },
  { path: '/example26', name: '26- Use of Vue Components', component: Example26 },
  { path: '/example27', name: '27- Tree Data (Parent/Child)', component: Example27 },
  { path: '/example28', name: '28- Tree Data (Hierarchical set)', component: Example28 },
  { path: '/example29', name: '29- Grid Header & Footer Slots', component: Example29 },
  { path: '/example30', name: '30- Composite Editor Model', component: Example30 },
  { path: '/example31', name: '31- Backend OData with RxJS', component: Example31 },
  { path: '/example32', name: '32- Columns Resize by Content', component: Example32 },
  { path: '/example33', name: '33- Regular & Custom Tooltip', component: Example33 },
  { path: '/example34', name: '34- Real-Time Trading Platform', component: Example34 },
  { path: '/example35', name: '35- Row Based Editing', component: Example35 },
  { path: '/example36', name: '36- Excel Export Formulas', component: Example36 },
  { path: '/example37', name: '37- Footer Totals Row', component: Example37 },
  { path: '/example38', name: '38- Infinite Scroll with OData', component: Example38 },
  { path: '/example39', name: '39- Infinite Scroll with GraphQL', component: Example39 },
  { path: '/example40', name: '40- Infinite Scroll from JSON data', component: Example40 },
  { path: '/example41', name: '41- Drag & Drop', component: Example41 },
  { path: '/example42', name: '42- Custom Pagination', component: Example42 },
  { path: '/example43', name: '43- Colspan/Rowspan (timesheets)', component: Example43 },
  { path: '/example44', name: '44- Colspan/Rowspan (large data)', component: Example44 },
  { path: '/example45', name: '45- Row Detail with inner Grid', component: Example45 },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
