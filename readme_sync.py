import argparse
import re
import sys
import os

SECTION_START_MARKER = r"^\s*#{2,}\s+Compatible versions\s*$"
VERSION_LINE_REGEX = r"^\s*-\s*([\w.-]+)\s*-\s*v?([\d.]+)\s*$"

def parse_arguments():
    parser = argparse.ArgumentParser(description="Update tool versions throughout a target README file based on a source README file's compatible versions section.")
    parser.add_argument("src_file", help="Path to the source README file (provides correct versions).")
    parser.add_argument("target_file", help="Path to the target README file to update globally.")
    args = parser.parse_args()

    if not os.path.isfile(args.src_file):
        print(f"Error: Source file not found: {args.src_file}", file=sys.stderr)
        sys.exit(1)
    if not os.path.isfile(args.target_file):
        print(f"Error: Target file not found: {args.target_file}", file=sys.stderr)
        sys.exit(1)

    return args

def find_and_parse_versions(file_path):
    versions = {}
    start_index = -1
    end_index = -1
    in_section = False
    lines = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}", file=sys.stderr)
        return None, -1, -1, []

    for i, line in enumerate(lines):
        if not in_section and re.match(SECTION_START_MARKER, line, re.IGNORECASE):
            in_section = True
            start_index = i
            end_index = i
        elif in_section:
            match = re.match(VERSION_LINE_REGEX, line)
            if match:
                tool_name = match.group(1).strip().lower()
                version = match.group(2).strip()
                if re.fullmatch(r"[\d.]+", version):
                    versions[tool_name] = version
                    end_index = i
            elif line.strip() and (line.strip().startswith('#') or not line.strip().startswith('-')):
                in_section = False
            elif not line.strip():
                pass

    if start_index == -1:
        # Silently return None if section not found, handled in main
        return None, -1, -1, lines

    return versions, start_index, end_index, lines


def update_target_file_globally_simple(
    target_file_path,
    source_versions_map,
    target_section_versions, # Can be None or {}
    target_start_idx,
    target_end_idx,
    target_lines
    ):

    if not target_lines:
        print("Error: Cannot process empty target file content.", file=sys.stderr)
        return False

    if target_section_versions is None:
        target_section_versions = {}

    updated_lines = list(target_lines)
    total_updates = 0
    section_updated = False
    version_replace_map = {}

    for tool_lower, new_version in source_versions_map.items():
        old_version = target_section_versions.get(tool_lower)
        if old_version is not None and old_version != new_version:
            if old_version not in version_replace_map:
                 version_replace_map[old_version] = new_version
            # Simplified: Assume no conflicting replacements needed from different tools

    if version_replace_map:
        for i, line in enumerate(updated_lines):
            modified_line = line
            line_updated = False
            for old_v, new_v in version_replace_map.items():
                pattern = re.compile(rf"\b{re.escape(old_v)}\b")
                modified_line, num_subs = pattern.subn(new_v, modified_line)
                if num_subs > 0:
                    total_updates += num_subs
                    line_updated = True
            if line_updated:
                updated_lines[i] = modified_line

    if target_start_idx != -1:
        new_section_lines = [target_lines[target_start_idx]]
        new_section_content_list = []
        for tool_lower, new_version in sorted(source_versions_map.items()):
            tool_name_parts = tool_lower.split('-')
            capitalized_tool_name = '-'.join(part.capitalize() for part in tool_name_parts)
            new_line = f"- {capitalized_tool_name} - v{new_version}\n"
            new_section_content_list.append(new_line)
        new_section_lines.extend(new_section_content_list)

        original_section_content_list = target_lines[target_start_idx+1 : target_end_idx+1]
        if original_section_content_list != new_section_content_list:
            section_updated = True
            updated_lines = updated_lines[:target_start_idx] + new_section_lines + updated_lines[target_end_idx + 1:]

    if total_updates > 0 or section_updated:
        if total_updates > 0:
            print(f"Global version string replacements made: {total_updates}")
        if section_updated:
             print("Compatible versions section was rebuilt/updated.")
        try:
            with open(target_file_path, 'w', encoding='utf-8') as f:
                f.writelines(updated_lines)
            print(f"Successfully updated {target_file_path}.")
            return True
        except Exception as e:
            print(f"\nError writing updated file {target_file_path}: {e}", file=sys.stderr)
            return False
    else:
        print("No version updates or section rebuilds were necessary.")
        return True


def main():
    args = parse_arguments()

    source_versions, _, _, src_lines = find_and_parse_versions(args.src_file)

    if source_versions is None or not src_lines:
        print("Error: Failed to parse source file or find compatible versions section.", file=sys.stderr)
        sys.exit(1)

    target_section_versions, target_start_idx, target_end_idx, target_lines = find_and_parse_versions(args.target_file)

    if not target_lines and target_section_versions is None:
        print(f"Error: Failed to read target file {args.target_file}.", file=sys.stderr)
        sys.exit(1)

    if source_versions is not None and target_section_versions is not None:
        source_items = sorted(source_versions.items())
        target_items = sorted(target_section_versions.items())
        if source_items == target_items:
            print("Source and Target compatible versions sections are identical (ignoring order). No updates needed.")
            sys.exit(0)

    update_target_file_globally_simple(
        args.target_file,
        source_versions,
        target_section_versions, # Can be None or {}
        target_start_idx,
        target_end_idx,
        target_lines
    )


if __name__ == "__main__":
    main()