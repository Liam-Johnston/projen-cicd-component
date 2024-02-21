import { CICDComponent, ICICDComponentOptions, Workflow } from '../generics';
import { Project, YamlFile } from 'projen';

import { GitlabWorkflow } from './workflow';

export interface IGitlabCICDComponentOptions extends ICICDComponentOptions {
  services?: string[];
  beforeScript?: string[];
  defaultTags?: string[];
  artefactExpiry?: string;
}

const codeChangeRequestRules = [
  '$CI_PIPELINE_SOURCE == "merge_request_event"',
  '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == $CI_DEFAULT_BRANCH',
];

const pushToMainRules = [
  '$CI_PIPELINE_SOURCE == "push"',
  '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH',
];

interface IncludeBlock {
  local: string;
  rules: { if: string }[];
}

const generateIncludes = (
  codeChangeRequestWorkflow: Workflow,
  pushToMainWorkflow: Workflow,
): IncludeBlock[] | undefined => {
  const include: IncludeBlock[] = [];

  if (codeChangeRequestWorkflow.hasJobs()) {
    include.push({
      local: codeChangeRequestWorkflow.filepath.slice(1),
      rules: codeChangeRequestRules.map((rule) => ({ if: rule })),
    });
  }

  if (pushToMainWorkflow.hasJobs()) {
    include.push({
      local: pushToMainWorkflow.filepath.slice(1),
      rules: pushToMainRules.map((rule) => ({ if: rule })),
    });
  }

  if (include.length === 0) {
    return undefined;
  }

  return include;
};

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
    new YamlFile(this.project, '.gitlab-ci.yml', {
      obj: {
        services: this.services,
        before_script: this.beforeScript,
        include: generateIncludes(
          this.codeChangeRequestWorkflow,
          this.pushToMainWorkflow,
        ),
      },
    });
  }
}
