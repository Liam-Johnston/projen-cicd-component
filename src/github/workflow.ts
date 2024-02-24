import { IJob, IWorkflowOptions, Workflow } from '../generics/workflow';
import { Project, YamlFile } from 'projen';

export interface IGithubWorkflowOptions extends IWorkflowOptions {
  defaultRunner?: string;
  triggerBranches?: string[];
}

const snakeCase = (unformatted: string) =>
  unformatted.toLowerCase().replace(/\s/g, '-');

interface GithubJobStep {
  name: string;
  uses: string;
  with?: Record<string, boolean | number | string | string[]>;
}

const checkoutStep: GithubJobStep = {
  name: 'Checkout Repository',
  uses: 'actions/checkout@v4',
  with: {
    'fetch-tags': true,
    'fetch-depth': 0,
  },
};

const generateArtifactsUploadStep = (job: IJob, jobName: string) => {
  const artifactsDirectories = job.steps
    .flatMap((job) => job.artifactDirectories)
    .filter((artifactDirectory) => artifactDirectory !== undefined)
    .join('\n');

  if (artifactsDirectories.length === 0) {
    return undefined;
  }

  return {
    name: 'Upload Artifacts',
    uses: 'actions/upload-artifact@v4',
    with: {
      name: jobName,
      path: artifactsDirectories,
    },
  };
};

const generateDependancies = (job: IJob) => {
  const needs: string[] = [];
  const artifacts: string[] = [];

  job.steps.forEach((step) => {
    needs.push(...(step.jobDependancies ?? []));

    const artifactDependancyJobNames =
      step.artifactsDependancies?.map((dependancy) =>
        snakeCase(dependancy.jobName),
      ) ?? [];

    needs.push(...artifactDependancyJobNames);
    artifacts.push(...artifactDependancyJobNames);
  });

  return {
    needs: needs.length > 0 ? needs : undefined,
    artifacts,
  };
};

const generateConcurrency = (job: IJob) => {
  if (job.concurrencyGroup === undefined) {
    return undefined;
  }

  return {
    group: job.concurrencyGroup,
  };
};

const generateJob = (job: IJob, defaultRunner: string) => {
  const snakeCaseName = job.name.toLowerCase().replace(/\s/g, '-');

  const steps = [
    checkoutStep,
    ...job.steps.map(({ name, commands, environmentVariables }) => ({
      name,
      env: environmentVariables,
      run: commands.reduce(
        (command, newCommand) => command + '\n' + newCommand,
      ),
    })),
  ];

  const uploadArtifactsStep = generateArtifactsUploadStep(job, snakeCaseName);

  if (uploadArtifactsStep !== undefined) {
    steps.push(uploadArtifactsStep);
  }

  const { needs, artifacts } = generateDependancies(job);

  if (artifacts.length > 0) {
    steps.push({
      name: 'Download Artifacts',
      uses: 'actions/download-artifact@v4',
      with: {
        name: artifacts,
      },
    });
  }

  return {
    [snakeCaseName]: {
      name: job.name,
      needs,
      concurrency: generateConcurrency(job),
      'runs-on': defaultRunner,
      steps,
    },
  };
};

const triggerTypeMap = {
  code_change_request: 'pull_request',
  push: 'push',
};

export class GithubWorkflow extends Workflow {
  public readonly triggerBranches: string[];

  private readonly defaultRunner: string;

  constructor(project: Project, options: IGithubWorkflowOptions) {
    super(project, options, 'github');

    this.triggerBranches = options.triggerBranches ?? ['main'];
    this.defaultRunner = options.defaultRunner ?? 'ubuntu-latest';
  }

  preSynthesize(): void {
    if (!this.hasJobs()) {
      return;
    }

    let jobs = {};

    this.jobs.forEach((job) => {
      jobs = { ...generateJob(job, this.defaultRunner), ...jobs };
    });

    const translatedTriggerType = triggerTypeMap[this.triggerType];

    new YamlFile(this.project, this.filepath, {
      obj: {
        name: this.name,
        on: {
          [translatedTriggerType]: {
            branches: this.triggerBranches,
          },
        },
        jobs,
      },
    });
  }
}
