"use client";

import { InfiniteMovingCards } from "./Uikit/components/ui/infinite-moving-card";
import { CryptoBetsOverview } from "./CryptoBetsOverview";
import { useQuery } from "@tanstack/react-query";
import { Bet } from "~~/types/bet";
import { movingCardItems } from "./constants";
import BetsOverview from "./BetsOverview";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";

function Home() {
  const { data, isLoading, error } = useScaffoldEventHistory({
    contractName: "BetMaker",
    eventName: "contracts::BetMaker::BetMaker::CryptoBetCreated",
    fromBlock: BigInt(0),
    blockData: true,
    transactionData: false,
    receiptData: false,
    watch: true,
    enabled: true,
  });
  console.log("DATA", data);
  return (
    <>
      <InfiniteMovingCards
        items={movingCardItems}
        direction="right"
        speed="slow"
        className="!mb-20"
      />

      {/* <BetsOverview /> */}
    </>
  );
}

export default Home;
