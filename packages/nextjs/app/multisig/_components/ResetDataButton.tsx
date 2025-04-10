import React, { useState } from "react";
import { useMultisigStore } from "../lib/multisigStore";

const ResetDataButton: React.FC = () => {
  const { resetDatabase } = useMultisigStore();
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetDatabase();
    } catch (error) {
      console.error("Error resetting database:", error);
      alert("Failed to reset database. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      className="py-1 px-2 w-fit text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded"
      disabled={loading}
    >
      {loading ? "Processing..." : "Reset Data"}
    </button>
  );
};

export default ResetDataButton;
