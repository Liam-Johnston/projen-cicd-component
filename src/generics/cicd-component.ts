import { Component, Project } from 'projen';

import { Workflow } from './workflow';

export class CICDComponent extends Component {
  public readonly codeChangeRequestWorkflow: Workflow;
  public readonly pushToMainWorkflow: Workflow;

  constructor(project: Project) {
    super(project);

    this.codeChangeRequestWorkflow = new Workflow(project);
    this.pushToMainWorkflow = new Workflow(project)
  }
}
