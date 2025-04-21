import { execa } from "execa";
import fs from "fs";

export async function createProjectDirectory(projectName: string) {
  // Check if directory already exists
  if (fs.existsSync(projectName)) {
    throw new Error(`Directory ${projectName} already exists. Cannot continue with an existing directory.`);
  }

  try {
    const result = await execa("mkdir", [projectName]);

    if (result.failed) {
      throw new Error("There was a problem running the mkdir command");
    }
  } catch (error) {
    throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : String(error)}`);
  }

  return true;
}
