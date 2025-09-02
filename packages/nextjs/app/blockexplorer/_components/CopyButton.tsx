import React from "react";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { CopyButtonProps } from "~~/utils/blockexplorer";

interface CopyButtonComponentProps extends CopyButtonProps {
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
}

export const CopyButton: React.FC<CopyButtonComponentProps> = ({
  text,
  fieldName,
  copiedField,
  onCopy,
}) => (
  <button
    onClick={() => onCopy(text, fieldName)}
    className="p-1 rounded hover:bg-base-300/50 transition-colors ml-2"
    title={`Copy ${fieldName}`}
  >
    {copiedField === fieldName ? (
      <CheckIcon className="h-4 w-4 text-success" />
    ) : (
      <DocumentDuplicateIcon className="h-4 w-4 text-base-content/60 hover:text-base-content" />
    )}
  </button>
);
