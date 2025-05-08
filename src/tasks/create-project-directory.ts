import { execa } from "execa";
import fs from "fs";

export async function createProjectDirectory(projectName: string) {
  // Check if directory already exists
  if (fs.existsSync(projectName)) {
    // If directory exists, check if it's empty
    if (fs.readdirSync(projectName).length > 0) {
      throw new Error(
        `Directory ${projectName} already exists and is not empty. Cannot continue.`,
      );
    }
    // If directory exists and is empty, we can proceed (or do nothing here, as it's already created and empty)
    // For clarity, we can return true or simply let the function continue if no further action is needed.
    // In this case, since the directory exists and is empty, the goal is achieved.
    return true;
  }

  try {
    const result = await execa("mkdir", [projectName]);

    if (result.failed) {
      throw new Error("There was a problem running the mkdir command");
    }
  } catch (error) {
    throw new Error(
      `Failed to create directory: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return true;
}
