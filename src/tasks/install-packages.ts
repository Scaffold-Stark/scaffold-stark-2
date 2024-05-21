import { projectInstall } from "pkg-install";
import {execa} from "execa";
import type {Options} from "../types";

export async function installPackages(targetDir: string, options: Options) {
  // Condition to check if 'devnet' is included and only update submodules
  // if (options.extensions?.includes("starknet-native")) {
  // }
  try {
    await execa("git", ["submodule", "update", "--init", "--recursive"], {
      cwd: targetDir,
    });
  } catch (error) {
    console.error("Failed to update submodules:", error);
    throw error;
  }
  return projectInstall({
    cwd: targetDir,
    prefer: "yarn",
  });
}
