/**
 * Utility functions for formatting data in the block explorer
 */

/**
 * Helper function to calculate time difference in a readable format
 */
export const getTimeAgo = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (timestamp?: number): string => {
  if (!timestamp) return "Unknown";
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Helper function to convert STRK to fri (BigInt)
 */
export const strkToFri = (friAmount: string): bigint => {
  const strkValue = parseFloat(friAmount);
  return BigInt(Math.round(strkValue * 1e18));
};

/**
 * Helper function to format fri to readable STRK
 */
export const friToStrk = (friValue: bigint): string => {
  const strkValue = Number(friValue) / 1e18;
  return strkValue.toFixed(4).replace(/\.?0+$/, "");
};

/**
 * Helper function to format transaction fees
 */
export const formatFee = (fee?: string): string => {
  if (!fee) return "0";
  try {
    return friToStrk(BigInt(fee));
  } catch {
    return fee;
  }
};

/**
 * Format age in minutes to human readable format
 */
export const formatAge = (ageInMinutes: number | null): string => {
  if (ageInMinutes === null) return "N/A";
  if (ageInMinutes < 60) return `${ageInMinutes}s`;
  if (ageInMinutes < 60 * 24) return `${Math.floor(ageInMinutes / 60)}m`;
  return `${Math.floor(ageInMinutes / (60 * 24))}d`;
};

/**
 * Calculate age in minutes from timestamp
 */
export const calculateAge = (timestamp?: number): number | null => {
  if (!timestamp) return null;
  return Math.floor((Date.now() / 1000 - timestamp) / 60);
};

/**
 * Truncate hash for display
 */
export const truncateHash = (
  hash: string,
  startLength = 6,
  endLength = 4,
): string => {
  if (hash.length <= startLength + endLength) return hash;
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
};

/**
 * Truncate address for display
 */
export const truncateAddress = (
  address: string,
  startLength = 6,
  endLength = 4,
): string => {
  return truncateHash(address, startLength, endLength);
};
