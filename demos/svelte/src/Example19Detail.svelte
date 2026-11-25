<script lang="ts">
  export let model: any;
  export let parentRef: any;
  export let addon: any;
  function alertAssignee() {
    alert(model.assignee ? `Assignee on this task is: ${model.assignee.toUpperCase()}` : 'No one is assigned to this task.');
  }
  function deleteRow() {
    if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
      addon?.collapseAll();
      dataView?.deleteItem(model.rowId);
      parentRef?.showFlashMessage?.(`Deleted row with ${model.title}`, 'danger');
    }
  }
  export let dataView: any;
  function callParent() {
    parentRef?.showFlashMessage?.(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
  }
</script>

<div class="container-fluid">
  <h3>{model?.title}</h3>
  <div class="row">
    <div class="col-3 detail-label">
      <label for="assignee">Assignee:</label> <input id="assignee" class="form-control" bind:value={model.assignee} />
    </div>
    <div class="col-3 detail-label"><span class="fw-semibold">Reporter:</span> <span>{model?.reporter}</span></div>
    <div class="col-3 detail-label"><span class="fw-semibold">Duration:</span> <span>{model?.duration}</span></div>
    <div class="col-3 detail-label"><span class="fw-semibold">% Complete:</span> <span>{model?.percentComplete}</span></div>
  </div>
  <div class="row">
    <div class="col-3 detail-label"><span class="fw-semibold">Start:</span> <span>{String(model?.start ?? '').slice(0, 10)}</span></div>
    <div class="col-3 detail-label"><span class="fw-semibold">Finish:</span> <span>{String(model?.finish ?? '').slice(0, 10)}</span></div>
    <div class="col-3 detail-label">
      <span class="fw-semibold">Effort Driven:</span> <i class:mdi={model?.effortDriven} class:mdi-check={model?.effortDriven}></i>
    </div>
  </div>
  <hr />
  <div class="col-sm-8">
    <h4>
      Find out who is the Assignee <small
        ><button class="btn btn-primary btn-sm" onclick={alertAssignee} data-test="assignee-btn">Click Me</button></small
      >
    </h4>
  </div>
  <div class="col-sm-4">
    <button class="btn btn-danger btn-sm" onclick={deleteRow} data-test="delete-btn">Delete Row</button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={callParent} data-test="parent-btn">Call Parent Method</button>
  </div>
</div>
