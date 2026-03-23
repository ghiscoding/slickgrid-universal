import React, { useState } from 'react';
import type { RowDetailViewProps } from 'slickgrid-react';
import './example04-detail-view.scss';
import { Button } from '@fluentui/react-components';

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

const Example04DetailView: React.FC<RowDetailViewProps<Item, any>> = (props) => {
  // const { ref, ...rest } = props;
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
          <label>Assignee:</label>
          <input
            className="form-control"
            value={assignee}
            onInput={($event) => assigneeChanged(($event.target as HTMLInputElement).value)}
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
          <label>Effort Driven:</label> <i className={props.model.effortDriven ? 'fic fic-checkmark' : ''}></i>
        </div>
      </div>

      <hr />

      <div className="col-sm-8">
        <h4>
          Find out who is the Assignee
          <small>
            <Button appearance="primary" className="ms-1" onClick={() => alertAssignee(props.model.assignee)} data-test="assignee-btn">
              Click Me
            </Button>
          </small>
        </h4>
      </div>

      <div className="col-sm-4">
        <Button onClick={() => deleteRow(props.model)} data-test="delete-btn">
          Delete Row
        </Button>
        <Button className="mx-1" onClick={() => callParentMethod(props.model)} data-test="parent-btn">
          Call Parent Method
        </Button>
      </div>
    </div>
  );
};

export default Example04DetailView;
