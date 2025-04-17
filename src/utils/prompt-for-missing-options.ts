import {
  Options,
  RawOptions,
} from "../types";
import inquirer from "inquirer";

// default values for unspecified args
const defaultOptions: RawOptions = {
  project: "my-dapp-example",
  directory: "./my-dapp-example",
  install: true,
  dev: false,
};

export async function promptForMissingOptions(
  options: RawOptions,
): Promise<Options> {
  const cliAnswers = Object.fromEntries(
    Object.entries(options).filter(([key, value]) => value !== null),
  );

  const questions = [
    {
      type: "input",
      name: "project",
      message: "Your project name:",
      default: defaultOptions.project,
      validate: (value: string) => value.length > 0,
    },
    {
      type: "input",
      name: "directory",
      message: "Directory to be installed in:",
      default: (answers: RawOptions) => `./${answers.project}`,
      validate: (value: string) => value.length > 0,
    },
    {
      type: "confirm",
      name: "install",
      message: "Install packages?",
      default: defaultOptions.install,
    }
  ];

  const answers = await inquirer.prompt(questions, cliAnswers);

  const mergedOptions: Options = {
    project: options.project ?? answers.project,
    directory: options.directory ?? answers.directory,
    install: options.install ?? answers.install,
    dev: options.dev ?? defaultOptions.dev,
  };

  return mergedOptions;
}
