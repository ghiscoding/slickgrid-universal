<script setup lang="ts">
import type { RowDetailViewProps } from 'slickgrid-vue';

interface Item {
  assignee: string;
  duration: Date;
  percentComplete: number;
  reporter: string;
  start: Date;
  finish: Date;
  effortDriven: boolean;
  title: string;
  rowId: number;
}

const props = defineProps<RowDetailViewProps<Item>>();

function alertAssignee(name: string) {
  if (typeof name === 'string') {
    alert(`Assignee on this task is: ${name.toUpperCase()}`);
  } else {
    alert('No one is assigned to this task.');
  }
}

function deleteRow(model: Item) {
  if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
    // you first need to collapse all rows (via the 3rd party addon instance)
    props.addon?.collapseAll();

    // then you can delete the item from the dataView
    props.dataView?.deleteItem(model.rowId);

    props.parent?.showFlashMessage(`Deleted row with ${model.title}`, 'danger');
  }
}

function callParentMethod(model: Item) {
  props.parent?.showFlashMessage(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
}
</script>
<template>
  <div class="container-fluid" style="margin-top: 10px">
    <h3>{{ model.title }}</h3>
    <div class="row">
      <div class="col-3 detail-label"><label>Assignee:</label> <input :value="model.assignee" class="form-control" /></div>
      <div class="col-3 detail-label">
        <label>Reporter:</label> <span>{{ model.reporter }}</span>
      </div>
      <div class="col-3 detail-label">
        <label>Duration:</label> <span>{{ model.duration?.toISOString?.() }}</span>
      </div>
      <div class="col-3 detail-label">
        <label>% Complete:</label> <span>{{ model.percentComplete }}</span>
      </div>
    </div>

    <div class="row">
      <div class="col-3 detail-label">
        <label>Start:</label> <span>{{ model.start?.toISOString() }}</span>
      </div>
      <div class="col-3 detail-label">
        <label>Finish:</label> <span>{{ model.finish?.toISOString() }}</span>
      </div>
      <div class="col-3 detail-label"><label>Effort Driven:</label> <i :class="model.effortDriven ? 'mdi mdi-check' : ''"></i></div>
    </div>

    <hr />

    <div class="col-sm-8">
      <h4>
        Find out who is the Assignee
        <small>
          <button class="btn btn-primary btn-sm" data-test="assignee-btn" @click="alertAssignee(model.assignee || '')">Click Me</button>
        </small>
      </h4>
    </div>

    <div class="col-sm-4">
      <button class="btn btn-primary btn-danger btn-sm" data-test="delete-btn" @click="deleteRow(model)">Delete Row</button>
      <button class="btn btn-outline-secondary btn-sm" data-test="parent-btn" @click="callParentMethod(model)">Call Parent Method</button>
    </div>
  </div>
</template>
<style lang="scss">
.detail-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
}

label {
  font-weight: 600;
}
</style>
