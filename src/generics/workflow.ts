/* eslint-disable @typescript-eslint/no-unused-vars */
import { Component } from "projen";

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
  addJob(job: Job) {
    throw new Error('Method not implemented.');
  }
}
