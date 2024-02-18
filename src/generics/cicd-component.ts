import { IJob, Workflow } from './workflow';

import { Component } from 'projen';

export interface ICICDComponentOptions {
  codeChangeRequestJobs?: IJob[];
  pushToMainWorkflowJobs?: IJob[];
}

export class CICDComponent extends Component {
  private _codeChangeRequestWorkflow!: Workflow;
  private _pushToMainWorkflow!: Workflow;

  public get codeChangeRequestWorkflow(): Workflow {
    return this._codeChangeRequestWorkflow;
  }

  protected set codeChangeRequestWorkflow(workflow: Workflow) {
    this._codeChangeRequestWorkflow = workflow;
  }

  public get pushToMainWorkflow(): Workflow {
    return this._pushToMainWorkflow;
  }

  protected set pushToMainWorkflow(workflow: Workflow) {
    this._pushToMainWorkflow = workflow;
  }
}
