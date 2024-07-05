"use client";
import MyBets from "./MyBets";
import { useAccount } from "@starknet-react/core";
import MyCryptoBets from "./MyCryptoBets";

function Page() {
  const { address, status, chainId, ...props } = useAccount();
  return (
    <div>
      {status === "disconnected" ? (
        <div>You need to be logged.</div>
      ) : (
        <>
          <MyCryptoBets />
          {/* <MyBets /> */}
        </>
      )}
    </div>
  );
}

export default Page;
