import { IWorkflowOptions, Workflow, WorkflowTriggers } from '../generics';
import { Project, YamlFile } from 'projen';

export interface IGitlabWorkflowOptions extends IWorkflowOptions {
  defaultTags?: string[];
}

const generateWorkflowRules = (triggerType: WorkflowTriggers): string[] => {
  if (triggerType === 'code_change_request') {
    return [
      '$CI_PIPELINE_SOURCE == "merge_request_event"',
      '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == $CI_DEFAULT_BRANCH',
    ];
  }

  return [
    '$CI_PIPELINE_SOURCE == "push"',
    '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH',
  ];
};

export class GitlabWorkflow extends Workflow {
  public readonly workflowRules: string[];
  private readonly defaultTags?: string[];

  constructor(project: Project, options: IGitlabWorkflowOptions) {
    super(project, options, 'gitlab');
    this.defaultTags = options.defaultTags;

    this.workflowRules = generateWorkflowRules(options.triggerType);
  }

  preSynthesize(): void {
    if (!this.hasJobs()) {
      return;
    }

    let jobs = {};

    this.jobs.forEach((job) => {
      jobs = {
        [job.name]: {
          script: job.steps.flatMap((step) => step.commands),
          tags: this.defaultTags,
        },
        ...jobs,
      };
    });

    new YamlFile(this.project, this.filepath, {
      obj: {
        workflow: {
          rules: this.workflowRules.map((rule) => ({ if: rule })),
        },
        ...jobs,
      },
    });
  }
}
