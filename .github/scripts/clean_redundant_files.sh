#!/bin/bash

# --- Configuration ---
TARGET_DIRS=("__test__" "__tests__" "public" ".github")

# --- Script Logic ---
set -e # Exit immediately if a command exits with a non-zero status.

# Check if inside a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Error: Not a git repository." >&2 # Output errors to stderr
    exit 1
fi

# Build the grep pattern: (dir1/|dir2/|dir3/)
grep_pattern="("
first=true
for dir in "${TARGET_DIRS[@]}"; do
    if [ "$first" = true ]; then
        first=false
    else
        grep_pattern+="|"
    fi
    grep_pattern+="${dir}/"
done
grep_pattern+=")"

# Find staged files matching the patterns
mapfile -t files_to_process < <(git diff --cached --name-only | grep -E "$grep_pattern")

# Exit if no matching files are staged
if [ ${#files_to_process[@]} -eq 0 ]; then
    # Optionally keep this message, or remove it for complete silence when nothing to do
    # echo "No staged files found matching target directories."
    exit 0
fi

# --- Perform Actions ---

# 1. Unstage the files
git restore --staged --quiet -- "${files_to_process[@]}"

# 2. Remove newly added files (which became untracked after step 1)
#    This command ignores tracked files.
git clean -fd

exit 0