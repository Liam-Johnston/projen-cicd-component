import { IgnoreFile, Version } from 'projen';

import { BunTypescript } from 'bun-ts-projen';
import { GitlabCICDComponent } from './src'

const project = new BunTypescript({
  devDeps: [
    'bun-ts-projen',
    'jsii',
    'jsii-diff',
    'jsii-docgen',
    'jsii-pacmak',
    'jsii-rosetta',
    'projen@0.76.29'
  ],
  repository: "https://github.com/Liam-Johnston/projen-cicd-component",
  name: 'projen-cicd-component',
  skipRunCommand: true,
  authorName: 'Liam Johnston',
  tsconfigFilename: 'tsconfig.dev.json',
});

project.gitignore.addPatterns('.jsii', 'lib/', 'tsconfig.json');

new Version(project, {
  versionInputFile: project.package.file.path,
  artifactsDirectory: './lib',
});

project.package.addField('jsii', {
  typescript: {
    compilerOptions: {
      target: "es2018"
    }
  },
  tsc: {
    outDir: 'lib',
    rootDir: 'src',
  },
});

project.package.addField('types', './lib/index.d.ts');

project.package.addPeerDeps('projen@0.76.29', 'constructs');

project.package.setScript('build', 'jsii --silence-warnings=reserved-word');

project.package.addField('files', ['lib', '.jsii', 'sample']);

const ignoreFile = new IgnoreFile(project, '.npmignore');

ignoreFile.addPatterns('node_modules/');

project.makefile.addRule({
  targets: ['build'],
  recipe: ['bun run build'],
});

new GitlabCICDComponent(project, {
  pushToMainWorkflowJobs: [{
    name: 'test',
    steps: [{
      commands: ['test']
    }]
  }]
})



project.synth();
