<script setup lang="ts">
import { Formatters, SlickgridVue, type Column, type GridOption } from 'slickgrid-vue';
import { onBeforeMount, onMounted, onUnmounted, ref, type Ref } from 'vue';

const NB_ITEMS = 100;

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset: Ref<any[]> = ref([]);
let previousBodyDir: string | null = null;

onBeforeMount(() => {
  defineGrid();
  dataset.value = mockData(NB_ITEMS);
});

onMounted(() => {
  previousBodyDir = document.body.getAttribute('dir');
  document.body.setAttribute('dir', 'rtl');
});

onUnmounted(() => {
  if (previousBodyDir) {
    document.body.setAttribute('dir', previousBodyDir);
  } else {
    document.body.removeAttribute('dir');
  }
});

function defineGrid() {
  columns.value = [
    { id: 'id', name: 'ID', field: 'id', filterable: true, sortable: true, minWidth: 60 },
    { id: 'title', name: 'Title', field: 'title', filterable: true, sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', filterable: true, sortable: true, minWidth: 100, type: 'number' },
    { id: '%', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true, minWidth: 100, type: 'number' },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
      filterable: true,
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
      filterable: true,
    },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', minWidth: 80 },
  ];

  gridOptions.value = {
    enableFiltering: true,
    gridHeight: 500,
    gridWidth: 700,
    rowHeight: 33,
    rtl: true, // ← Enable RTL mode
  };
}

function mockData(count: number) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: i,
      title: `Task ${i}`,
      duration: Math.round(Math.random() * 100),
      percentComplete: Math.round(Math.random() * 100),
      start: new Date(2024, 0, 1 + Math.floor(Math.random() * 30)).toISOString().split('T')[0],
      finish: new Date(2024, 1, 1 + Math.floor(Math.random() * 28)).toISOString().split('T')[0],
      effortDriven: i % 5 === 0,
    });
  }
  return data;
}
</script>

<template>
  <div id="demo-container" class="container-fluid">
    <h2>
      Example 57: RTL (Right-to-Left)
      <span class="float-end">
        <a
          style="font-size: 18px"
          target="_blank"
          href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example57.vue"
        >
          <span class="mdi mdi-link-variant"></span> code
        </a>
      </span>
    </h2>
    <div class="subtitle">Basic grid with RTL (Right-to-Left) enabled for RTL languages</div>

    <div dir="rtl">
      <slickgrid-vue grid-id="grid57" :columns="columns" :options="gridOptions" :dataset="dataset"></slickgrid-vue>
    </div>
  </div>
</template>
