/**
 * Utility functions for formatting data in the block explorer
 */

/**
 * Helper function to calculate time difference in a readable format
 */
export const getTimeAgo = (timestampInSeconds: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diffInSeconds = now - timestampInSeconds;

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
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
