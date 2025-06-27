export function isValidContractArgs(
  args: unknown,
  expectedLength: number
): boolean {
  return (
    Array.isArray(args) &&
    args.length === expectedLength &&
    args.every((arg) => arg !== undefined && arg !== null && arg !== "")
  );
}
