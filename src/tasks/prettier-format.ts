import * as prettier from "prettier";
import fs from "fs";
import { glob } from 'glob';

export async function prettierFormat(targetDir: string) {
  try {
    const files = glob.sync(`${targetDir}/**/*.{ts,js,json,css,md}`, { nodir: true });

    for (const file of files) {
      const fileContents = fs.readFileSync(file, "utf8");
      const options = await prettier.resolveConfig(file);

      if (options) {
        const formatted = await prettier.format(fileContents, { ...options, filepath: file });
        fs.writeFileSync(file, formatted);
      }
    }

    return true;
  } catch (error) {
    throw new Error("Failed to format files", { cause: error });
  }
}
