import { DockerCompose, IgnoreFile, Version } from 'projen';

import { BunTypescript } from 'bun-ts-projen';
import { GitHubCICDComponent } from './src';

const project = new BunTypescript({
  devDeps: [
    'bun-ts-projen',
    'jsii',
    'jsii-diff',
    'jsii-docgen',
    'jsii-pacmak',
    'jsii-rosetta',
    'projen@0.76.29',
  ],
  repository: 'https://github.com/Liam-Johnston/projen-cicd-component',
  name: 'projen-cicd-component',
  skipRunCommand: true,
  authorName: 'Liam Johnston',
  tsconfigFilename: 'tsconfig.dev.json',
});

project.gitignore.addPatterns('.jsii', 'lib/', 'tsconfig.json');

project.package.addField('jsii', {
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
  targets: ['install'],
  recipe: ['docker compose run --rm app bun i']
})

project.makefile.addRule({
  targets: ['build'],
  prerequisites: ['install'],
  recipe: ['docker compose run --rm app bun run build'],
});

new Version(project, {
  versionInputFile: project.package.file.path,
  artifactsDirectory: './lib',
});

project.makefile.addRule({
  targets: ['bump'],
  recipe: ['docker compose run --rm node npm run bump'],
});

project.composeFile.addService('node', {
  imageBuild: {
    context: './containers',
    dockerfile: 'Dockerfile.node',
    args: {
      NODE_VERSION: '20.11.1-alpine3.18',
    },
  },
  environment: {
    NPM_TOKEN: '${NPM_TOKEN:-}',
  },
  volumes: [DockerCompose.bindVolume('./', '/app')],
});

project.makefile.addRule({
  targets: ['node_shell'],
  recipe: ['docker compose run --rm node sh'],
});

project.makefile.addRule({
  targets: ['commit_release'],
  recipe: ['docker compose run --rm node make _commit_release'],
});

project.makefile.addRule({
  targets: ['_commit_release'],
  recipe: [
    "git config --global user.name 'Github Actions'",
    "git config --global user.email 'github@actions.com'",
    "git commit -am 'chore(release)'",
    'git tag $(cat ./lib/releasetag.txt)',
    'git push --follow-tags',
  ],
});

project.makefile.addRule({
  targets: ['publish'],
  recipe: ['docker compose run --rm node npm publish']
})


new GitHubCICDComponent(project, {
  pushToMainWorkflowJobs: [
    {
      name: 'Test',
      steps: [
        {
          name: 'test',
          commands: [
            'git tag -l'
          ]
        }
      ]
    }]
})


// new GitHubCICDComponent(project, {
//   pushToMainWorkflowJobs: [
//     {
//       name: 'Build and Publish',
//       steps: [
//         {
//           name: 'Build',
//           commands: ['make build'],
//         },
//         {
//           name: 'Bump Version',
//           commands: [
//             'git config --global --add safe.directory /app',
//             'make bump'
//           ],
//         },
//         {
//           name: 'Commit Release',
//           commands: ['make commit_release'],
//         },
//         {
//           name: 'Publish to NPM',
//           commands: ['make publish'],
//           environmentVariables: {
//             NPM_TOKEN: "$NPM_TOKEN"
//           }
//         },
//       ],
//     },
//   ],
// });

project.synth();
