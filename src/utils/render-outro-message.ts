import type { Options } from "../types";
import chalk from "chalk";
import { execa } from "execa";

export async function renderOutroMessage(options: Options) {
  let message = `
  \n
  ${chalk.bold.green("Congratulations!")} Your project has been scaffolded! 🎉

  ${chalk.bold("Next steps:")}
  
  ${chalk.dim("cd")} ${options.project}
  `;

  if (
    options.extensions.includes("scaffold-stark")
  ) {
    message += `
    \t${chalk.bold("Start the local development node")}
    \t${chalk.dim("yarn")} chain
    `;

    message += `
    \t${chalk.bold("In a new terminal window, deploy your contracts")}
    \t${chalk.dim("yarn")} deploy
   `;
  }

  message += `
  \t${chalk.bold("In a new terminal window, start the frontend")}
  \t${chalk.dim("yarn")} start
  `;

  message += `
  ${chalk.bold.green("Thanks for using Scaffold-Stark 2 🙏, Happy Building!")}
  `;

  console.log(message);
}
