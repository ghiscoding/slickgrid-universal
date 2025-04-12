import React, { forwardRef, useState } from 'react';
import type { RowDetailViewProps } from 'slickgrid-react';

import './example19-detail-view.scss';

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

const Example19DetailView: React.FC<RowDetailViewProps<Item, any>> = forwardRef((props, _ref) => {
  const [assignee, setAssignee] = useState<string>(props.model?.assignee || '');

  function assigneeChanged(newAssignee: string) {
    setAssignee(newAssignee);
  }

  function alertAssignee(name: string) {
    if (typeof name === 'string') {
      alert(`Assignee on this task is: ${name.toUpperCase()}`);
    } else {
      alert('No one is assigned to this task.');
    }
  }

  function deleteRow(model: any) {
    if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
      // you first need to collapse all rows (via the 3rd party addon instance)
      props.addon.collapseAll();

      // then you can delete the item from the dataView
      props.dataView.deleteItem(model.rowId);

      props.parentRef.showFlashMessage(`Deleted row with ${model.title}`, 'danger');
    }
  }

  function callParentMethod(model: any) {
    props.parentRef.showFlashMessage(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
  }

  return (
    <div className="container-fluid" style={{ marginTop: '10px' }}>
      <h3>{props.model.title}</h3>
      <div className="row">
        <div className="col-3 detail-label">
          <label>Assignee:</label>{' '}
          <input
            className="form-control"
            value={assignee}
            onInput={function ($event) {
              assigneeChanged(($event.target as HTMLInputElement).value);
            }}
          />
        </div>
        <div className="col-3 detail-label">
          <label>Reporter:</label> <span>{props.model.reporter}</span>
        </div>
        <div className="col-3 detail-label">
          <label>Duration:</label> <span>{props.model.duration?.toISOString?.()}</span>
        </div>
        <div className="col-3 detail-label">
          <label>% Complete:</label> <span>{props.model.percentComplete}</span>
        </div>
      </div>

      <div className="row">
        <div className="col-3 detail-label">
          <label>Start:</label> <span>{props.model.start?.toISOString()}</span>
        </div>
        <div className="col-3 detail-label">
          <label>Finish:</label> <span>{props.model.finish?.toISOString()}</span>
        </div>
        <div className="col-3 detail-label">
          <label>Effort Driven:</label> <i className={props.model.effortDriven ? 'mdi mdi-check' : ''}></i>
        </div>
      </div>

      <hr />

      <div className="col-sm-8">
        <h4>
          Find out who is the Assignee
          <small>
            <button
              className="btn btn-primary btn-sm"
              onClick={function () {
                alertAssignee(props.model.assignee);
              }}
              data-test="assignee-btn"
            >
              Click Me
            </button>
          </small>
        </h4>
      </div>

      <div className="col-sm-4">
        <button
          className="btn btn-primary btn-danger btn-sm"
          onClick={function () {
            deleteRow(props.model);
          }}
          data-test="delete-btn"
        >
          Delete Row
        </button>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={function () {
            callParentMethod(props.model);
          }}
          data-test="parent-btn"
        >
          Call Parent Method
        </button>
      </div>
    </div>
  );
});

export default Example19DetailView;
