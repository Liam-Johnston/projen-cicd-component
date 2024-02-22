import { CICDComponent, ICICDComponentOptions, Workflow } from '../generics';
import { Project, YamlFile } from 'projen';

import { GitlabWorkflow } from './workflow';

// The merge_request_event pipeline trigger is buggy so as a workaround we can just execute like this.
const CODE_CHANGE_REQUEST_RULE =
  '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH != $CI_DEFAULT_BRANCH';
const CODE_CHANGE_EVENT_RULE =
  '$CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == $CI_DEFAULT_BRANCH';
const PUSH_TO_MAIN_RULE =
  '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH';

export interface IGitlabCICDComponentOptions extends ICICDComponentOptions {
  services?: string[];
  beforeScript?: string[];
  defaultTags?: string[];
  artefactExpiry?: string;
  manualJobs?: string[];
}

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
      rules: [
        {
          if: CODE_CHANGE_REQUEST_RULE,
        },
        {
          if: CODE_CHANGE_EVENT_RULE,
        },
      ],
    });
  }

  if (pushToMainWorkflow.hasJobs()) {
    include.push({
      local: pushToMainWorkflow.filepath.slice(1),
      rules: [
        {
          if: PUSH_TO_MAIN_RULE,
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
    const include = generateIncludes(
      this.codeChangeRequestWorkflow,
      this.pushToMainWorkflow,
    );

    // If there are no workflow jobs, don't create a file
    if (include === undefined) {
      return;
    }

    new YamlFile(this.project, '.gitlab-ci.yml', {
      obj: {
        services: this.services,
        before_script: this.beforeScript,
        include,
      },
    });
  }
}
