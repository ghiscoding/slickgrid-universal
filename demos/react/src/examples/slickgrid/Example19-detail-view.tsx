import { format } from '@formkit/tempo';
import React, { useState } from 'react';
import type { RowDetailViewProps } from 'slickgrid-react';
import './example19-detail-view.scss';

interface Item {
  assignee: string;
  duration: number;
  percentComplete: number;
  reporter: string;
  start: Date;
  finish: Date;
  effortDriven: boolean;
  title: string;
  rowId: number;
}

const Example19DetailView: React.FC<RowDetailViewProps<Item, any>> = ({ model, addon, grid, dataView, parentRef }) => {
  // const { ref, ...rest } = props;
  const [assignee, setAssignee] = useState<string>(model?.assignee || '');

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
      addon.collapseAll();

      // then you can delete the item from the dataView
      grid && dataView.deleteItem(model.rowId);

      parentRef.showFlashMessage(`Deleted row with ${model.title}`, 'danger');
    }
  }

  function callParentMethod(model: any) {
    parentRef.showFlashMessage(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
  }

  return (
    <div className="container-fluid" style={{ marginTop: '10px' }}>
      <h3>{model.title}</h3>
      <div className="row">
        <div className="col-3 detail-label">
          <label>Assignee:</label>
          <input
            className="form-control"
            value={assignee}
            onInput={($event) => assigneeChanged(($event.target as HTMLInputElement).value)}
          />
        </div>
        <div className="col-3 detail-label">
          <label>Reporter:</label> <span>{model.reporter}</span>
        </div>
        <div className="col-3 detail-label">
          <label>Duration:</label> <span>{model.duration || 0}</span>
        </div>
        <div className="col-3 detail-label">
          <label>% Complete:</label> <span>{model.percentComplete}</span>
        </div>
      </div>

      <div className="row">
        <div className="col-3 detail-label">
          <label>Start:</label> <span>{model.start ? format(model.start, 'YYYY-MM-DD') : ''}</span>
        </div>
        <div className="col-3 detail-label">
          <label>Finish:</label> <span>{model.finish ? format(model.finish, 'YYYY-MM-DD') : ''}</span>
        </div>
        <div className="col-3 detail-label">
          <label>Effort Driven:</label> <i className={model.effortDriven ? 'mdi mdi-check' : ''}></i>
        </div>
      </div>

      <hr />

      <div className="col-sm-8">
        <h4>
          Find out who is the Assignee
          <small>
            <button className="btn btn-primary btn-sm mx-1" onClick={() => alertAssignee(model.assignee)} data-test="assignee-btn">
              Click Me
            </button>
          </small>
        </h4>
      </div>

      <div className="col-sm-4">
        <button className="btn btn-primary btn-danger btn-sm mx-1" onClick={() => deleteRow(model)} data-test="delete-btn">
          Delete Row
        </button>
        <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={() => callParentMethod(model)} data-test="parent-btn">
          Call Parent Method
        </button>
      </div>
    </div>
  );
};

export default Example19DetailView;
