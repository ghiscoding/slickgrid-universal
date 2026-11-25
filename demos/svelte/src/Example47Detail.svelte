<script lang="ts">
  export let model: any;
  export let addon: any;
  export let dataView: any;
  export let parentRef: any;

  function alertAssignee() {
    alert(
      typeof model.assignee === 'string' ? `Assignee on this task is: ${model.assignee.toUpperCase()}` : 'No one is assigned to this task.'
    );
  }

  function deleteRow() {
    if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
      addon?.collapseAll();
      dataView?.deleteItem(model.id);
      parentRef?.showFlashMessage?.(`Deleted row with ${model.title}`, 'danger');
    }
  }

  function showNotification() {
    parentRef?.showFlashMessage?.(`We just called Parent Method from the Row Detail Child Component on ${model.title}`, 'info');
  }
</script>

<div class="container-fluid" style="margin-top: 10px">
  <h3>{model.title}</h3>
  <div class="row">
    <div class="col-3 detail-label">
      <label class="detail-field-label" for="assignee">Assignee:</label>
      <input id="assignee" value={model.assignee} class="form-control assignee" />
    </div>
    <div class="col-3 detail-label"><span class="detail-field-label">Reporter:</span> <span>{model.reporter}</span></div>
    <div class="col-3 detail-label"><span class="detail-field-label">Duration:</span> <span>{model.duration}</span></div>
    <div class="col-3 detail-label"><span class="detail-field-label">% Complete:</span> <span>{model.percentComplete}</span></div>
  </div>
  <div class="row">
    <div class="col-3 detail-label">
      <span class="detail-field-label">Start:</span> <span>{model.start ? new Date(model.start).toISOString().slice(0, 10) : ''}</span>
    </div>
    <div class="col-3 detail-label">
      <span class="detail-field-label">Finish:</span> <span>{model.finish ? new Date(model.finish).toISOString().slice(0, 10) : ''}</span>
    </div>
    <div class="col-3 detail-label">
      <span class="detail-field-label">Effort Driven:</span> <i class:mdi={model.effortDriven} class:mdi-check={model.effortDriven}></i>
    </div>
  </div>
  <hr />
  <div class="col-sm-8">
    <h4>
      Find out who is the Assignee <small
        ><button class="btn btn-primary btn-sm" data-test="assignee-btn" onclick={alertAssignee}>Click Me</button></small
      >
    </h4>
  </div>
  <div class="col-sm-4">
    <button class="btn btn-primary btn-danger btn-sm" data-test="delete-btn" onclick={deleteRow}>Delete Row</button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="parent-btn" onclick={showNotification}>Call Parent Method</button>
  </div>
</div>

<style>
  :global(.detail-label) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
  }
  :global(.detail-label .detail-field-label) {
    font-weight: 600;
  }
</style>
