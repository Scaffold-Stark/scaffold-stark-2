"use client";
import { useUser } from "@/contexts/userContenxt";
import { Button } from "@radix-ui/themes";
import { useEffect } from "react";

export default function ConnectWalletButton() {
  const userContext = useUser();
  useEffect(() => {
    if (userContext?.isLoggedIn) {
      console.log("Logged in");
    }
  }, [userContext?.isLoggedIn]);
  return (
    <Button
      onClick={
        userContext?.login
      }
    >
      Connect Wallet
    </Button>
  );
}
