import { CICDComponent, ICICDComponentOptions } from '../generics';
import { Project, YamlFile } from 'projen';

import { GitlabWorkflow } from './workflow';

export interface IGitlabCICDComponentOptions extends ICICDComponentOptions {
  services?: string[];
  beforeScript?: string[];
  defaultTags?: string[];
  artefactExpiry?: string;
}

export class GitlabCICDComponent extends CICDComponent {
  private readonly services?: string[];
  private readonly beforeScript?: string[];

  constructor(project: Project, options: IGitlabCICDComponentOptions) {
    super(project);

    this.services = options.services;
    this.beforeScript = options.beforeScript;

    const artefactExpiry = options.artefactExpiry ?? '30 days';

    this.codeChangeRequestWorkflow = new GitlabWorkflow(project, {
      name: 'Merge Request',
      triggerType: 'code_change_request',
      defaultTags: options.defaultTags,
      jobs: options.codeChangeRequestJobs,
      artefactExpiry,
    });

    this.pushToMainWorkflow = new GitlabWorkflow(project, {
      name: 'Push to Main',
      triggerType: 'push',
      defaultTags: options.defaultTags,
      jobs: options.pushToMainWorkflowJobs,
      artefactExpiry,
    });
  }

  preSynthesize(): void {
    const workflowsWithJobs = [
      this.codeChangeRequestWorkflow,
      this.pushToMainWorkflow,
    ].filter((workflow) => workflow.hasJobs());

    new YamlFile(this.project, '.gitlab-ci.yml', {
      obj: {
        services: this.services,
        before_script: this.beforeScript,
        include: workflowsWithJobs.map((workflow) => ({
          local: workflow.filepath.slice(1),
        })),
      },
    });
  }
}
