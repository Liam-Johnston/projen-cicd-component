import { BunTypescript } from "bun-ts-projen";
const project = new BunTypescript({
  devDeps: ["bun-ts-projen"],
  name: "projen-cicd-component",

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();