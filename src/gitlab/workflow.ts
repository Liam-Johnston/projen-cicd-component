import {
  IJobStep,
  IWorkflowOptions,
  Workflow,
  WorkflowTriggers,
} from '../generics';
import { Project, YamlFile } from 'projen';

export interface IGitlabWorkflowOptions extends IWorkflowOptions {
  defaultTags?: string[];
  artefactExpiry: string;
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

const generateVariables = (
  steps: IJobStep[],
): Record<string, string> | undefined => {
  const jobEnvironmentVariables = steps.reduce(
    (environmentVariables, step) => ({
      ...environmentVariables,
      ...step.environmentVariables,
    }),
    {},
  );

  if (Object.keys(jobEnvironmentVariables).length === 0) {
    return undefined;
  }

  return jobEnvironmentVariables;
};

const generateArtifacts = (
  steps: IJobStep[],
): Record<string, string | string[]> | undefined => {
  const artefactPaths = steps.reduce(
    (determinedPaths, step) =>
      determinedPaths.concat(step.artifactDirectorys ?? []),
    [] as string[],
  );

  if (artefactPaths.length === 0) {
    return undefined;
  }

  return {
    paths: artefactPaths,
    when: 'on_success',
    expire_in: '30 days',
  };
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
          variables: generateVariables(job.steps),
          tags: this.defaultTags,
          artifacts: generateArtifacts(job.steps),
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
