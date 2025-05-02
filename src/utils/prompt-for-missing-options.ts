import { Options, RawOptions } from "../types";
import inquirer from "inquirer";

// default values for unspecified args
const defaultOptions: RawOptions = {
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
      name: "directory",
      message:
        "Where do you want to install the new files? Choose ./ (root folder) or provide a new folder name.",
      default: defaultOptions.directory,
      validate: (value: string) => value.length > 0,
    },
  ];

  const answers = await inquirer.prompt(questions, cliAnswers);

  // Guarantee install is a boolean
  const installOption: boolean =
    options.install === null
      ? (defaultOptions.install as boolean)
      : options.install;

  const mergedOptions: Options = {
    directory: options.directory ?? answers.directory,
    install: installOption,
    dev: options.dev ?? defaultOptions.dev,
  };

  return mergedOptions;
}
