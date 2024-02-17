import { CICDComponent } from '../generics';
import { GithubWorkflow } from './workflow';
import { Project } from 'projen';
import { Workflow } from '../generics/workflow';

export class GitHubCICDComponent extends CICDComponent {
  public readonly codeChangeRequestWorkflow: Workflow;
  public readonly pushToMainWorkflow: Workflow;

  constructor(project: Project) {
    super(project);

    this.codeChangeRequestWorkflow = new GithubWorkflow(project, {
      name: 'Pull Request',
      triggerType: 'code_change_request'
    });

    this.pushToMainWorkflow = new GithubWorkflow(project, {
      name: 'Push to Main',
      triggerType: 'push'
    })
  }
}
