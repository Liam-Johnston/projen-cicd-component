import { Component, Project } from 'projen';

export type WorkflowTriggers = 'code_change_request' | 'push';

type WorkflowVariants = 'gitlab' | 'github';

export interface IJobArtefactDependancy {
  jobName: string;
}

export interface IJobStep {
  commands: string[];
  name?: string;
  environmentVariables?: Record<string, string>;
  artifactDirectories?: string[];
  artefactDependancies?: IJobArtefactDependancy[];
  jobDependancies?: string[];
}

export interface IJob {
  name: string;
  steps: IJobStep[];
  environment?: string;
  concurrencyGroup?: string;
}

export interface IWorkflowOptions {
  name: string;
  triggerType: WorkflowTriggers;
  jobs?: IJob[];
}

export class Workflow extends Component {
  protected jobs: IJob[];
  protected triggerType: WorkflowTriggers;
  public readonly filepath: string;
  public readonly name: string;

  constructor(
    project: Project,
    options: IWorkflowOptions,
    workflowVariant: WorkflowVariants,
  ) {
    super(project);

    const fileName = `${options.name.toLowerCase().replace(/\s/g, '-')}.yml`;
    this.filepath = `./.${workflowVariant}/workflows/${fileName}`;

    this.triggerType = options.triggerType;
    this.name = options.name;
    this.jobs = options.jobs ?? [];
  }

  addJob(job: IJob) {
    this.jobs.push(job);
  }

  hasJobs() {
    return this.jobs.length > 0;
  }
}
