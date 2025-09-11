#!/usr/bin/env node
import { readdirSync, statSync, existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

interface CompileOptions {
  force?: boolean;
  verbose?: boolean;
}

interface FileInfo {
  fullPath: string;
  relativePath: string;
  name: string;
  mtime: number;
}

/**
 * Optimized recompilation check that minimizes file system operations
 *
 * @param options - Compilation options
 * @returns true if recompilation is needed, false otherwise
 */
export function shouldRecompile(options: CompileOptions = {}): boolean {
  const { force = false, verbose = false } = options;

  if (force) {
    if (verbose) console.log("🔄 Force recompilation requested");
    return true;
  }

  const srcDir = resolve(process.cwd(), "contracts", "src");
  const targetDevDir = resolve(process.cwd(), "contracts", "target", "dev");

  if (verbose) {
    console.log(`📂 Checking source directory: ${srcDir}`);
    console.log(`🎯 Checking target directory: ${targetDevDir}`);
  }

  try {
    // Single optimized check for all files and configurations
    return needsRecompilation(srcDir, targetDevDir, verbose);
  } catch (error) {
    console.error("❌ Error checking recompilation status:", error);
    // On error, default to recompiling for safety
    return true;
  }
}

/**
 * Single optimized function that checks all recompilation conditions
 */
function needsRecompilation(
  srcDir: string,
  targetDevDir: string,
  verbose: boolean
): boolean {
  const scarbInfo = readScarbToml(srcDir);
  if (!scarbInfo) {
    if (verbose) console.log("⚠️  Could not read Scarb.toml");
    return true; // Recompile on error
  }

  const cairoFiles = getCairoFiles(srcDir, verbose);
  if (cairoFiles.length === 0) {
    console.log("⚠️  No Cairo files found in src directory");
    return false;
  }

  const targetFiles = getTargetFiles(targetDevDir);

  if (scarbInfo.mtime > getLatestTargetMtime(targetFiles)) {
    if (verbose) {
      console.log("🔄 Recompilation needed: Scarb.toml has been modified");
      console.log(`   Scarb.toml: ${new Date(scarbInfo.mtime).toISOString()}`);
    }
    return true;
  }

  // Check each Cairo file against its corresponding target file
  for (const cairoFile of cairoFiles) {
    const moduleNames = extractContractModuleNames(cairoFile.fullPath);
    // If no contract modules found, fall back to previous behavior (legacy single-output)
    const expectedNames =
      moduleNames.length > 0
        ? moduleNames.map(
            (m) => `${scarbInfo.packageName}_${m}.contract_class.json`
          )
        : [`${scarbInfo.packageName}_${cairoFile.name}.contract_class.json`];

    for (const expectedJsonName of expectedNames) {
      const targetFile = targetFiles.get(expectedJsonName);

      if (!targetFile) {
        if (verbose) {
          console.log(`📄 Missing compiled file: ${expectedJsonName}`);
        }
        return true;
      }

      if (cairoFile.mtime > targetFile.mtime) {
        if (verbose) {
          console.log(
            `📅 ${cairoFile.relativePath} is newer than ${expectedJsonName}`
          );
          console.log(`   Cairo: ${new Date(cairoFile.mtime).toISOString()}`);
          console.log(`   JSON:  ${new Date(targetFile.mtime).toISOString()}`);
        }
        return true;
      }
    }
  }

  if (verbose) {
    console.log("✅ All contracts are up to date");
  }
  return false;
}

/**
 * Reads Scarb.toml once and caches the package name and timestamp
 */
function readScarbToml(
  srcDir: string
): { packageName: string; mtime: number } | null {
  try {
    const scarbTomlPath = resolve(srcDir, "..", "Scarb.toml");

    if (!existsSync(scarbTomlPath)) {
      return null;
    }

    const scarbTomlStat = statSync(scarbTomlPath);
    const content = readFileSync(scarbTomlPath, "utf-8");

    // Extract package name using regex
    const packageNameMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m);
    const packageName = packageNameMatch ? packageNameMatch[1] : "contracts";

    return {
      packageName,
      mtime: scarbTomlStat.mtime.getTime(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Gets the most recent modification time from target files map
 */
function getLatestTargetMtime(targetFiles: Map<string, FileInfo>): number {
  let latestMtime = 0;
  for (const file of targetFiles.values()) {
    latestMtime = Math.max(latestMtime, file.mtime);
  }
  return latestMtime;
}

/**
 * Compiles the contracts using scarb build, but only if needed
 */
export function smartCompile(options: CompileOptions = {}): void {
  const { force = false, verbose = false } = options;

  if (shouldRecompile({ force, verbose })) {
    console.log("🔨 Compiling contracts...");
    try {
      execSync("cd contracts && scarb build", { stdio: "inherit" });
      console.log("✅ Compilation completed successfully");
    } catch (error) {
      console.error("❌ Compilation failed:", error);
      throw error;
    }
  } else {
    console.log("⏭️  Skipping compilation - all contracts are up to date");
  }
}

/**
 * Gets all Cairo files with their timestamps in one pass
 */
function getCairoFiles(srcDir: string, verbose: boolean): FileInfo[] {
  const files: FileInfo[] = [];

  function scanDirectory(dir: string, relativeDir = "") {
    try {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, join(relativeDir, item));
        } else if (item.endsWith(".cairo") && item !== "lib.cairo") {
          const name = item.replace(".cairo", "");
          files.push({
            fullPath,
            relativePath: join(relativeDir, item),
            name,
            mtime: stat.mtime.getTime(),
          });
        }
      }
    } catch (error) {
      if (verbose) {
        console.log(`⚠️  Error scanning directory ${dir}:`, error.message);
      }
    }
  }

  scanDirectory(srcDir);
  return files;
}

/**
 * Extracts all contract module names declared with #[starknet::contract] pub mod <Name>
 * from a Cairo source file. Returns an empty array if none found.
 */
function extractContractModuleNames(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, "utf-8");
    const names: string[] = [];
    const regex =
      /#\s*\[\s*starknet::contract\s*\][\s\S]{0,300}?pub\s+mod\s+([A-Za-z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const modName = match[1];
      if (modName && !names.includes(modName)) {
        names.push(modName);
      }
    }
    return names;
  } catch {
    return [];
  }
}

/**
 * Gets all target files with their timestamps in one pass
 */
function getTargetFiles(targetDevDir: string): Map<string, FileInfo> {
  const targetFiles = new Map<string, FileInfo>();

  try {
    if (!existsSync(targetDevDir)) {
      return targetFiles;
    }

    const items = readdirSync(targetDevDir);

    for (const item of items) {
      if (item.endsWith(".json")) {
        const fullPath = join(targetDevDir, item);
        const stat = statSync(fullPath);
        targetFiles.set(item, {
          fullPath,
          relativePath: item,
          name: item.replace(".json", ""),
          mtime: stat.mtime.getTime(),
        });
      }
    }
  } catch (error) {
    // Return empty map on error
  }

  return targetFiles;
}

// CLI interface for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");
  const verbose = args.includes("--verbose") || args.includes("-v");

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Smart Contract Compiler

Usage: ts-node compile.ts [options]

Options:
  --force, -f     Force recompilation even if files are up to date
  --verbose, -v   Show detailed output
  --help, -h      Show this help message

Examples:
  ts-node compile.ts                    # Smart compile (only if needed)
  ts-node compile.ts --force           # Force recompilation
  ts-node compile.ts --verbose         # Show detailed output
`);
    process.exit(0);
  }

  try {
    smartCompile({ force, verbose });
  } catch (error) {
    console.error("Compilation failed");
    process.exit(1);
  }
}
