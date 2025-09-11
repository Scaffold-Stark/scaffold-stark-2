import React from "react";

interface LoadingStateProps {
  message?: string;
  currentPage?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  currentPage,
}) => (
  <div className="bg-base-100 rounded-lg shadow-lg p-8 border border-base-300">
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="loading loading-spinner loading-lg text-primary"></div>
      <h3 className="text-lg font-semibold text-base-content">{message}</h3>
      <p className="text-base-content/60 text-center">
        {currentPage === 1
          ? "Fetching data from the blockchain..."
          : currentPage
            ? `Loading page ${currentPage}...`
            : "Please wait..."}
      </p>
    </div>
  </div>
);
