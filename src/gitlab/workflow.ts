import { IJob, IJobStep, IWorkflowOptions, Workflow } from '../generics';
import { Project, YamlFile } from 'projen';

export interface IGitlabWorkflowOptions extends IWorkflowOptions {
  defaultTags?: string[];
  artifactsExpiry: string;
  manualJobs?: string[];
}

const generateVariables = (
  steps: IJobStep[],
  environment: string | undefined,
): Record<string, string> | undefined => {
  const environmentVariables: Record<string, string> = {};

  if (environment !== undefined) {
    environmentVariables['ENVIRONMENT'] = environment;
  }

  const jobEnvironmentVariables = steps.reduce(
    (environmentVariables, step) => ({
      ...environmentVariables,
      ...step.environmentVariables,
    }),
    environmentVariables,
  );

  if (Object.keys(jobEnvironmentVariables).length === 0) {
    return undefined;
  }

  return jobEnvironmentVariables;
};

const generateArtifacts = (
  steps: IJobStep[],
  artifactsExpiry: string,
): Record<string, string | string[]> | undefined => {
  const artifactsPaths = steps.reduce(
    (determinedPaths, step) =>
      determinedPaths.concat(step.artifactDirectories ?? []),
    [] as string[],
  );

  if (artifactsPaths.length === 0) {
    return undefined;
  }

  return {
    paths: artifactsPaths,
    when: 'on_success',
    expire_in: artifactsExpiry,
  };
};

const generateTags = (
  deafultTags: string[],
  environment?: string,
): string[] | undefined => {
  return deafultTags.concat(environment ?? []);
};

interface Dependancy {
  job: string;
  artifacts?: boolean;
}

const generateDependancies = (job: IJob): Dependancy[] | undefined => {
  const dependancies: Dependancy[] = [];

  job.steps.forEach((step) => {
    step.jobDependancies?.forEach((dependancy) => {
      dependancies.push({
        job: dependancy,
      });
    });

    step.artifactsDependancies?.forEach((dependancy) => {
      dependancies.push({
        job: dependancy.jobName,
        artifacts: true,
      });
    });
  });

  if (dependancies.length === 0) {
    return undefined;
  }

  return dependancies;
};

const generateWhen = (job: IJob, manualJobs: string[]): string | undefined => {
  if (!manualJobs.includes(job.name)) {
    return undefined;
  }

  return 'manual';
};

export class GitlabWorkflow extends Workflow {
  private readonly defaultTags: string[];
  private readonly artifactsExpiry: string;
  private readonly manualJobs: string[];

  constructor(project: Project, options: IGitlabWorkflowOptions) {
    super(project, options, 'gitlab');
    this.defaultTags = options.defaultTags ?? [];
    this.artifactsExpiry = options.artifactsExpiry;
    this.manualJobs = options.manualJobs ?? [];
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
          variables: generateVariables(job.steps, job.environment),
          tags: generateTags(this.defaultTags, job.environment),
          artifacts: generateArtifacts(job.steps, this.artifactsExpiry),
          needs: generateDependancies(job),
          when: generateWhen(job, this.manualJobs),
          resource_group: job.concurrencyGroup,
        },
        ...jobs,
      };
    });

    new YamlFile(this.project, this.filepath, {
      obj: {
        ...jobs,
      },
    });
  }
}
