import type { ReactNode } from "react";

type CommonErrorKey =
  | "INSUFFICIENT_ACCOUNT_BALANCE"
  | "VALIDATION_FAILURE"
  | "INVALID_TRANSACTION_NONCE"
  | "TRANSACTION_EXECUTION_ERROR"
  | "CLASS_ALREADY_DECLARED"
  | "NON_ACCOUNT";

const friendlyErrorMessages: Record<CommonErrorKey, ReactNode> = {
  INSUFFICIENT_ACCOUNT_BALANCE: (
    <>
      <p className="font-semibold text-red-500">Insufficient balance</p>
      <p className="text-sm">
        You don’t have enough funds to cover the transaction fee.
      </p>
    </>
  ),
  VALIDATION_FAILURE: (
    <>
      <p className="font-semibold text-yellow-600">Validation failure</p>
      <p className="text-sm">Account validation failed</p>
    </>
  ),
  INVALID_TRANSACTION_NONCE: (
    <>
      <p className="font-semibold text-red-500">Invalid nonce</p>
      <p className="text-sm">
        Your account state is out of sync. Try again in a few seconds.
      </p>
    </>
  ),
  TRANSACTION_EXECUTION_ERROR: (
    <>
      <p className="font-semibold text-red-500">Transaction failed</p>
      <p className="text-sm">
        Something went wrong during execution. Check the contract logic or
        inputs.
      </p>
    </>
  ),
  CLASS_ALREADY_DECLARED: (
    <>
      <p className="font-semibold text-red-500">Already declared</p>
      <p className="text-sm">
        This contract class has already been declared. You can skip this step.
      </p>
    </>
  ),
  NON_ACCOUNT: (
    <>
      <p className="font-semibold text-red-500">Invalid account</p>
      <p className="text-sm">
        The sender address is not a valid account contract.
      </p>
    </>
  ),
};

export function getUserFriendlyError(content: any): ReactNode | null {
  const msg = typeof content === "string" ? content : content?.message;
  if (!msg || typeof msg !== "string") return null;

  const match = Object.keys(friendlyErrorMessages).find((key) =>
    msg.includes(key),
  ) as CommonErrorKey | undefined;

  return match ? friendlyErrorMessages[match] : null;
}
