import { execa } from "execa";
import { Options, TemplateDescriptor } from "../types";
import { baseDir } from "../utils/consts";
import { findFilesRecursiveSync } from "../utils/find-files-recursively";
import { mergePackageJson } from "../utils/merge-package-json";
import fs from "fs";
import url from 'url';
import ncp from "ncp";
import path from "path";
import { promisify } from "util";
import link from "../utils/link";

const copy = promisify(ncp);
let copyOrLink = copy;

const isTemplateRegex = /([^\/\\]*?)\.template\./;
const isPackageJsonRegex = /package\.json/;
const isYarnLockRegex = /yarn\.lock/;
const isNextGeneratedRegex = /packages\/nextjs\/generated/;
const isArgsRegex = /([^\/\\]*?)\.args\./;
const isGitKeepRegex = /\.gitkeep/;

// Additional files/directories to exclude from template copying
const excludePatterns = [
  /\.github\//,               // GitHub specific files
  /CHANGELOG\.md/,            // Changelog file
  // /CONTRIBUTING\.md/,         // Contributing guide
  /\.devcontainer\.json/,     // Dev container configuration
  /\.editorconfig/,           // Editor configuration
  /\.tool-versions/,          // Tool versions config is project-specific
  /deploy\.config\.ts/,       // Deployment configs might be project-specific
];

const copyBaseFiles = async (
    { dev: isDev }: Options,
    basePath: string,
    targetDir: string
  ) => {
  await copyOrLink(basePath, targetDir, {
    clobber: false,
    filter: (fileName) => {  // NOTE: filter IN
      const isTemplate = isTemplateRegex.test(fileName);
      const isPackageJson = isPackageJsonRegex.test(fileName);
      const isYarnLock = isYarnLockRegex.test(fileName);
      const isNextGenerated = isNextGeneratedRegex.test(fileName);
      const isGitKeep = isGitKeepRegex.test(fileName);

      // Check if file matches any exclude pattern
      const isExcluded = excludePatterns.some(pattern => pattern.test(fileName));

      const skipAlways = isTemplate || isPackageJson || isGitKeep || isExcluded;
      const skipDevOnly = isYarnLock || isNextGenerated;
      const shouldSkip = skipAlways || (isDev && skipDevOnly);

      return !shouldSkip;
    },
  });

  ["snfoundry", "nextjs"].forEach(packageName => {
    const envExamplePath = path.join(basePath, "packages", packageName, ".env.example");
    const envPath = path.join(targetDir, "packages", packageName, ".env");
    if (fs.existsSync(envExamplePath)) {
      copy(envExamplePath, envPath);
    }
  });

  const basePackageJsonPaths = findFilesRecursiveSync(basePath, (path: string) => isPackageJsonRegex.test(path));

  basePackageJsonPaths.forEach((packageJsonPath: string) => {
    const partialPath = packageJsonPath.split(basePath)[1];
    mergePackageJson(
      path.join(targetDir, partialPath),
      path.join(basePath, partialPath),
      isDev
    );
  });

  if (isDev) {
    const baseYarnLockPaths = findFilesRecursiveSync(basePath, (path: string) => isYarnLockRegex.test(path));
    baseYarnLockPaths.forEach((yarnLockPath: string) => {
      const partialPath = yarnLockPath.split(basePath)[1];
      copy(
        path.join(basePath, partialPath),
        path.join(targetDir, partialPath)
      );
    });

    const nextGeneratedPaths = findFilesRecursiveSync(basePath, (path: string) => isNextGeneratedRegex.test(path));
    nextGeneratedPaths.forEach((nextGeneratedPath: string) => {
      const partialPath = nextGeneratedPath.split(basePath)[1];
      copy(
        path.join(basePath, partialPath),
        path.join(targetDir, partialPath)
      );
    });
  }
};

const processTemplatedFiles = async (
  { dev: isDev }: Options,
  basePath: string,
  targetDir: string
) => {
  const baseTemplatedFileDescriptors: TemplateDescriptor[] =
    findFilesRecursiveSync(basePath, (path: string) => isTemplateRegex.test(path)).map(
      (baseTemplatePath: string) => ({
        path: baseTemplatePath,
        fileUrl: url.pathToFileURL(baseTemplatePath).href,
        relativePath: baseTemplatePath.split(basePath)[1],
        source: "base",
      })
    );

  await Promise.all(
    baseTemplatedFileDescriptors.map(async (templateFileDescriptor) => {
      const templateTargetName =
        templateFileDescriptor.path.match(isTemplateRegex)?.[1]!;

      const argsPath = templateFileDescriptor.relativePath.replace(
        isTemplateRegex,
        `${templateTargetName}.args.`
      );

      // Without extensions, we can directly load the template
      const template = (await import(templateFileDescriptor.fileUrl)).default;

      if (!template) {
        throw new Error(
          `Template ${templateTargetName} from ${templateFileDescriptor.source} doesn't have a default export`
        );
      }
      if (typeof template !== "function") {
        throw new Error(
          `Template ${templateTargetName} from ${templateFileDescriptor.source} is not exporting a function by default`
        );
      }

      // Execute template with empty args
      const output = template({});

      const targetPath = path.join(
        targetDir,
        templateFileDescriptor.relativePath.split(templateTargetName)[0],
        templateTargetName
      );
      fs.writeFileSync(targetPath, output);

      if (isDev) {
        const devOutput = `--- TEMPLATE FILE
templates/${templateFileDescriptor.source}${templateFileDescriptor.relativePath}


--- ARGS FILES
(no args files writing to the template)


--- RESULTING ARGS
(no args sent for the template)
`;
        fs.writeFileSync(`${targetPath}.dev`, devOutput);
      }
    })
  );
};

export async function copyTemplateFiles(
  options: Options,
  templateDir: string,
  targetDir: string
) {
  copyOrLink = options.dev ? link : copy;
  const basePath = path.join(templateDir, baseDir);

  // 1. Copy base template to target directory
  await copyBaseFiles(options, basePath, targetDir);

  // 2. Process templated files and generate output
  await processTemplatedFiles(options, basePath, targetDir);

  // 3. Initialize git repo to avoid husky error
  await execa("git", ["init"], { cwd: targetDir });
  await execa("git", ["checkout", "-b", "main"], { cwd: targetDir });
}
