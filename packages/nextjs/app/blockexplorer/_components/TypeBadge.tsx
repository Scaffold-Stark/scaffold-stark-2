import React from "react";
import { getTypeBadge } from "~~/utils/blockexplorer";

interface TypeBadgeProps {
  type: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(type)}`}
  >
    {type}
  </span>
);
