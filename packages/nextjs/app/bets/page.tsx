"use client";
import MyBets from "./MyBets";
import { useAccount } from "@starknet-react/core";

function Page() {
  const { address, status, chainId, ...props } = useAccount();
  return (
    <div>
      {status === "disconnected" ? (
        <div>You need to be logged.</div>
      ) : (
        <MyBets />
      )}
    </div>
  );
}

export default Page;
