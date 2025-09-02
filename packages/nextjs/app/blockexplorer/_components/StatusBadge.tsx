import React from "react";
import { getStatusBadge } from "~~/utils/blockexplorer";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(status)}`}
  >
    {status}
  </span>
);
