import { execa } from "execa";
import path from "path";

export async function prettierFormat(targetDir: string) {
  try {
    const nextjsPath = path.join(targetDir, "packages/nextjs");
    const result = await execa("yarn", ["format"], { cwd: nextjsPath });

    if (result.failed) {
      throw new Error("There was a problem running the format command");
    }
  } catch (error) {
    throw new Error("Failed to format Next.js project", { cause: error });
  }

  return true;
}
