/* eslint-disable @typescript-eslint/no-unused-vars */
import { Component, Project } from "projen";

export type WorkflowTriggers = 'code_change_request' | 'push'

interface JobStep {
  name?: string;
  commands: string[];
}

export interface Job {
  name: string;
  steps: JobStep[];
}

export class Workflow extends Component {
  protected jobs: Job[]
  public filepath: string

  constructor(project: Project) {
    super(project)
    this.filepath = ''
    this.jobs = []
  }

  addJob(job: Job) {
    this.jobs.push(job)
  }

  hasJobs() {
    return this.jobs.length > 0
  }
}
