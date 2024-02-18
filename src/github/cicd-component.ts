import { CICDComponent, ICICDComponentOptions } from '../generics';

import { GithubWorkflow } from './workflow';
import { Project } from 'projen';

export interface IGitHubCICDComponentOptions extends ICICDComponentOptions {}

export class GitHubCICDComponent extends CICDComponent {
  constructor(project: Project, options: IGitHubCICDComponentOptions) {
    super(project);

    this.codeChangeRequestWorkflow = new GithubWorkflow(project, {
      name: 'Pull Request',
      triggerType: 'code_change_request',
      jobs: options.codeChangeRequestJobs,
    });

    this.pushToMainWorkflow = new GithubWorkflow(project, {
      name: 'Push to Main',
      triggerType: 'push',
      jobs: options.pushToMainWorkflowJobs,
    });
  }
}
