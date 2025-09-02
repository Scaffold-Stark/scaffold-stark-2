import React from "react";

interface ErrorStateProps {
  title: string;
  message: string;
  emoji?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  emoji = "⚠️",
  onRetry,
}) => (
  <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-8">
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-error text-6xl mb-4">{emoji}</div>
      <h2 className="text-2xl font-bold text-error mb-2">{title}</h2>
      <p className="text-base-content/70 text-center max-w-md mb-4">
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  </div>
);
