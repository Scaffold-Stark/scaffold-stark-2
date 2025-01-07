"use client";

import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";
import { DataTable } from "./_positions/data-table";
import { columns } from "./_positions/colums";
import { useAccount } from "@starknet-react/core";
import { feltToHex } from "~~/utils/scaffold-stark/common";
import { num } from "starknet";
import { useMemo } from "react";

function UserPositions() {
  const { address } = useAccount();
  const {
    data: positions,
    isLoading,
    error,
  } = useScaffoldEventHistory({
    contractName: "BetMaker",
    eventName: "contracts::BetMaker::BetMaker::CryptoBetPositionCreated",
    fromBlock: BigInt(1018365),
    blockData: true,
    transactionData: false,
    receiptData: false,
    /* filters: { user: "value" }, */
    /* watch: true, */
    enabled: true,
  });

  const loggedUserPositions = useMemo(() => {
    return positions.filter((position) => {
      return (
        num.cleanHex(feltToHex(position.args.user)) ===
        num.cleanHex(address ?? "")
      );
    });
  }, [positions.length, address]);

  return (
    <div>
      <DataTable
        columns={columns}
        data={loggedUserPositions}
        isLoading={!positions || isLoading}
      />
    </div>
  );
}

export default UserPositions;
