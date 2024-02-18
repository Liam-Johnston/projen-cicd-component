import { IJob, IWorkflowOptions, Workflow } from '../generics/workflow';
import { Project, YamlFile } from 'projen';

export interface IGithubWorkflowOptions extends IWorkflowOptions {
  defaultRunner?: string;
  triggerBranches?: string[];
}

const checkoutStep = {
  name: 'Checkout Repository',
  uses: 'actions/checkout@v4',
  with: {
    fetchTags: true
  }
  // with: {
  //   ref: '${{ github.event.pull_request.head.ref }}',
  // },
};

const generateJob = (job: IJob, defaultRunner: string) => {
  const snakeCaseName = job.name.toLowerCase().replace(/\s/g, '-');

  return {
    [snakeCaseName]: {
      name: job.name,
      'runs-on': defaultRunner,
      steps: [
        checkoutStep,
        ...job.steps.map(({ name, commands, environmentVariables }) => ({
          name,
          env: environmentVariables,
          run: commands.reduce(
            (command, newCommand) => command + '\n' + newCommand,
          ),
        })),
      ],
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
