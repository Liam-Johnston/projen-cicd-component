import { Job, Workflow, WorkflowTriggers } from '../generics';
import { Project, YamlFile } from 'projen';

interface GitlabWorkflowOptions {
  name: string;
  jobs?: Job[];
  triggerType: WorkflowTriggers;
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
  public readonly name: string;
  public readonly workflowRules: string[];
  public readonly filepath: string;
  private readonly defaultTags?: string[]

  constructor(project: Project, options: GitlabWorkflowOptions) {
    super(project);

    this.jobs = options.jobs ?? [];
    this.name = options.name;
    this.defaultTags = options.defaultTags

    const fileName = `${options.name.toLowerCase().replaceAll(' ', '-')}.yml`;
    this.filepath = `./.gitlab/workflows/${fileName}`;

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
          script: job.steps.flatMap(step => step.commands),
          tags: this.defaultTags
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
