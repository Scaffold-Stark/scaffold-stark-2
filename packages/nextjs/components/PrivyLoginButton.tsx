"use client";

import { usePrivy } from "@privy-io/react-auth";
import { storeUser } from "~~/services/web3/privy/storage";
import { useEffect } from "react";

export const PrivyLoginButton = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Automatically store user info when authenticated
  useEffect(() => {
    if (authenticated && user?.id) {
      const success = storeUser(user.id);
      if (!success) {
        console.error("Failed to store user info");
      }
    }
  }, [authenticated, user?.id]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!ready) {
    return (
      <button className="btn btn-primary btn-sm" disabled>
        Loading...
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button className="btn btn-primary btn-sm" onClick={handleLogin}>
        Login with Privy
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700 truncate max-w-[200px]">
        {user?.email?.address || user?.id}
      </span>
      <button className="btn btn-outline btn-sm" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};
