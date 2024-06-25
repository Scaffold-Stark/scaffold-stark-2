import { projectInstall } from "pkg-install";
import {execa} from "execa";
import type {Options} from "../types";
import path from "path";

export async function installPackages(targetDir: string, options: Options) {
  // Condition to check if 'devnet' is included and only update submodules
  // if (options.extensions?.includes("starknet-native")) {
  // }

  return projectInstall({
    cwd: targetDir,
    prefer: "yarn",
  });
}
