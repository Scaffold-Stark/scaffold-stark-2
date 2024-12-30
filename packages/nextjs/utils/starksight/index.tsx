import { NolossBetVariants } from "~~/app/constants";

export function isNolossBetVariant(value: string): boolean {
  return Object.values(NolossBetVariants).includes(value as NolossBetVariants);
}
