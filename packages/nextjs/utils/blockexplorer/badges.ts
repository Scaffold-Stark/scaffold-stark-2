/**
 * Utility functions for badge styling in the block explorer
 */

/**
 * Helper function to get status badge styling
 */
export const getStatusBadge = (status: string): string => {
  switch (status) {
    case "ACCEPTED_ON_L2":
    case "SUCCEEDED":
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "REJECTED":
    case "REVERTED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Helper function to get type badge styling
 */
export const getTypeBadge = (type: string): string => {
  switch (type) {
    case "INVOKE":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "DEPLOY":
    case "DEPLOY_ACCOUNT":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "DECLARE":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Get status badge styling for transaction status
 */
export const getTransactionStatusStyling = (status: string): string => {
  if (status === "SUCCEEDED") {
    return "bg-success/20 text-success";
  }
  if (status === "REVERTED") {
    return "bg-error/20 text-error";
  }
  return "bg-warning/20 text-warning";
};

/**
 * Get address type badge styling
 */
export const getAddressTypeStyling = (type: string): string => {
  switch (type) {
    case "ACCOUNT":
      return "bg-green-500";
    case "CONTRACT":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

/**
 * Get class version badge styling
 */
export const getClassVersionStyling = (version: string): string => {
  switch (version) {
    case "Cairo 2":
      return "bg-orange-500";
    case "Cairo 1":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};
