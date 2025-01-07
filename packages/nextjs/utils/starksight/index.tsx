import { NolossBetVariants } from "~~/app/constants";

export function isNolossBetVariant(value: string): boolean {
  return Object.values(NolossBetVariants).includes(value as NolossBetVariants);
}

export function isTwoDaysAfterUTC(date: Date) {
  const nowUTC = Date.now();

  const twoDaysAfterUTC = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 2, // 2 days After
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );

  return nowUTC >= twoDaysAfterUTC;
}
