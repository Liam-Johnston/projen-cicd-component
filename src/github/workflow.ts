import { Job, Workflow, WorkflowTriggers } from '../generics/workflow';
import { Project, YamlFile } from 'projen';

interface GithubWorkflowOptions {
  name: string;
  defaultRunner?: string;
  jobs?: Job[];
  triggerType: WorkflowTriggers;
  triggerBranches?: string[];
}

const checkoutStep = {
  name: 'Checkout Repository',
  uses: 'actions/checkout@v4',
  with: {
    ref: '${{ github.event.pull_request.head.ref }}',
  },
};

const generateJob = (job: Job, defaultRunner: string) => {
  const snakeCaseName = job.name.toLowerCase().replaceAll(' ', '_');

  return {
    [snakeCaseName]: {
      name: job.name,
      'runs-on': defaultRunner,
      steps: [
        checkoutStep,
        ...job.steps.map(({ name, commands }) => ({
          name,
          run: commands.reduce((command, newCommand) => command + '\n' + newCommand),
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
  public readonly name: string;
  public readonly triggerType: string;
  public readonly triggerBranches: string[];

  private readonly defaultRunner: string;

  constructor(project: Project, options: GithubWorkflowOptions) {
    super(project);

    this.triggerType = triggerTypeMap[options.triggerType];
    this.triggerBranches = options.triggerBranches ?? ['main'];
    this.name = options.name;
    this.jobs = options.jobs ?? [];
    this.defaultRunner = options.defaultRunner ?? 'ubuntu-latest';
  }

  preSynthesize(): void {
    const fileName = `${this.name.toLowerCase().replaceAll(' ', '-')}.yml`;

    let jobs = {};

    this.jobs.forEach((job) => {
      jobs = { ...generateJob(job, this.defaultRunner), ...jobs };
    });

    new YamlFile(this.project, `./.github/workflows/${fileName}`, {
      obj: {
        name: this.name,
        on: {
          [this.triggerType]: {
            branches: this.triggerBranches,
          },
        },
        jobs,
      },
    });
  }
}
