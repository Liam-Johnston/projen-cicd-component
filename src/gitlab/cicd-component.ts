import { CICDComponent, ICICDComponentOptions, Workflow } from '../generics';
import { Project, YamlFile } from 'projen';

import { GitlabWorkflow } from './workflow';

export interface IGitlabCICDComponentOptions extends ICICDComponentOptions {
  services?: string[];
  beforeScript?: string[];
  defaultTags?: string[];
  artefactExpiry?: string;
  manualJobs?: string[];

  codeChangeRequestRule?: string;
  pushToMainRule?: string;
}

const defaultCodeChangeRequestRule =
  '$CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == $CI_DEFAULT_BRANCH';

const defaultPushToMainRules =
  '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH';

interface IncludeBlock {
  local: string;
  rules: { if: string }[];
}

const generateIncludes = (
  codeChangeRequestWorkflow: Workflow,
  codeChangeRequestRule: string,
  pushToMainWorkflow: Workflow,
  pushToMainRule: string,
): IncludeBlock[] | undefined => {
  const include: IncludeBlock[] = [];

  if (codeChangeRequestWorkflow.hasJobs()) {
    include.push({
      local: codeChangeRequestWorkflow.filepath.slice(1),
      rules: [
        {
          if: codeChangeRequestRule,
        },
      ],
    });
  }

  if (pushToMainWorkflow.hasJobs()) {
    include.push({
      local: pushToMainWorkflow.filepath.slice(1),
      rules: [
        {
          if: pushToMainRule,
        },
      ],
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
  private readonly pushToMainRule: string;
  private readonly codeChangeRequestRule: string;

  constructor(project: Project, options: IGitlabCICDComponentOptions) {
    super(project);

    this.pushToMainRule = options.pushToMainRule ?? defaultPushToMainRules;
    this.codeChangeRequestRule =
      options.codeChangeRequestRule ?? defaultCodeChangeRequestRule;

    this.services = options.services;
    this.beforeScript = options.beforeScript;

    const artefactExpiry = options.artefactExpiry ?? '30 days';

    this.codeChangeRequestWorkflow = new GitlabWorkflow(project, {
      name: 'Merge Request',
      triggerType: 'code_change_request',
      defaultTags: options.defaultTags,
      jobs: options.codeChangeRequestJobs,
      artefactExpiry,
      manualJobs: options.manualJobs,
    });

    this.pushToMainWorkflow = new GitlabWorkflow(project, {
      name: 'Push to Main',
      triggerType: 'push',
      defaultTags: options.defaultTags,
      jobs: options.pushToMainWorkflowJobs,
      artefactExpiry,
      manualJobs: options.manualJobs,
    });
  }

  preSynthesize(): void {
    new YamlFile(this.project, '.gitlab-ci.yml', {
      obj: {
        services: this.services,
        before_script: this.beforeScript,
        include: generateIncludes(
          this.codeChangeRequestWorkflow,
          this.codeChangeRequestRule,
          this.pushToMainWorkflow,
          this.pushToMainRule
        ),
      },
    });
  }
}
