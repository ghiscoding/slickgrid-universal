<script setup lang="ts">
import { type SlickGrid } from 'slickgrid-vue';
import { ref } from 'vue';

const props = defineProps<{
  model: any;
  grid: SlickGrid;
  selectedItem?: any;
  onSelectedItemChanged: (selectedItem: any) => void;
}>();

const elm = ref<HTMLDivElement>();
const itemSelected = ref(props.selectedItem);

function focus() {
  elm.value!.querySelector('select')?.focus();
}

function hide() {
  elm.value!.style.display = 'none';
}

function show() {
  elm.value!.style.display = 'block';
}

function setValue(item: any) {
  itemSelected.value = item;
}

function handleSelectedItem() {
  props.onSelectedItemChanged(itemSelected.value);
}

defineExpose({
  focus,
  hide,
  show,
  setValue,
});
</script>

<template>
  <div ref="elm">
    <span v-if="model.collection">
      <select class="form-control form-select" @change="handleSelectedItem" v-model="itemSelected">
        <option v-for="item of model.collection" :value="item">
          {{ item.name }}
        </option>
      </select>
    </span>
  </div>
</template>
