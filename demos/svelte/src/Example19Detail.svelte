<script lang="ts">
  import { format } from '@formkit/tempo';

  let { model, addon, dataView, parentRef }: { model: any; addon: any; dataView: any; parentRef: any } = $props();

  function alertAssignee(name?: string) {
    if (name) {
      alert(`Assignee on this task is: ${name.toUpperCase()}`);
    } else {
      alert('No one is assigned to this task.');
    }
  }

  function deleteRow() {
    if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
      // you first need to collapse all rows (via the 3rd party addon instance)
      addon?.collapseAll();

      // then you can delete the item from the dataView
      dataView?.deleteItem(model.rowId);

      parentRef?.showFlashMessage(`Deleted row with ${model.title}`, 'danger');
    }
  }

  function callParentMethod() {
    parentRef?.showFlashMessage(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
  }
</script>

<div class="container-fluid" style="margin-top: 10px">
  <h3>{model.title}</h3>
  <div class="row">
    <div class="col-3 detail-label">
      <label class="detail-field-label" for="assignee-{model.rowId}">Assignee:</label>
      <input id="assignee-{model.rowId}" value={model.assignee} class="form-control" />
    </div>
    <div class="col-3 detail-label"><span class="detail-field-label">Reporter:</span> <span>{model.reporter}</span></div>
    <div class="col-3 detail-label"><span class="detail-field-label">Duration:</span> <span>{model.duration}</span></div>
    <div class="col-3 detail-label"><span class="detail-field-label">% Complete:</span> <span>{model.percentComplete}</span></div>
  </div>

  <div class="row">
    <div class="col-3 detail-label">
      <span class="detail-field-label">Start:</span> <span>{model.start ? format(model.start, 'YYYY-MM-DD') : ''}</span>
    </div>
    <div class="col-3 detail-label">
      <span class="detail-field-label">Finish:</span> <span>{model.finish ? format(model.finish, 'YYYY-MM-DD') : ''}</span>
    </div>
    <div class="col-3 detail-label">
      <span class="detail-field-label">Effort Driven:</span> <i class={model.effortDriven ? 'mdi mdi-check' : ''}></i>
    </div>
  </div>

  <hr />

  <div class="col-sm-8">
    <h4>
      Find out who is the Assignee
      <small>
        <button class="btn btn-primary btn-sm" data-test="assignee-btn" onclick={() => alertAssignee(model.assignee)}>Click Me</button>
      </small>
    </h4>
  </div>

  <div class="col-sm-4">
    <button class="btn btn-primary btn-danger btn-sm" data-test="delete-btn" onclick={deleteRow}>Delete Row</button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="parent-btn" onclick={callParentMethod}>Call Parent Method</button>
  </div>
</div>
