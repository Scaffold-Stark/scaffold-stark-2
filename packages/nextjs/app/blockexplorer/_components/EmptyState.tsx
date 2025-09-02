import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  emoji?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  emoji = "📭",
}) => (
  <div className="bg-base-100 rounded-lg shadow-lg p-8 border border-base-300">
    <div className="text-center py-8">
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-base-content mb-2">{title}</h3>
      <p className="text-base-content/70">{description}</p>
    </div>
  </div>
);
