"use client";

import React, { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Bet } from "~~/types/bet";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "./Uikit/components/ui/alert";
import { Rocket, Terminal, TriangleAlert } from "lucide-react";
import BetsOverviewSkeletons, {
  BetOverviewSkeletons,
} from "./skeletons/BetsOverviewSkeletons";
import BetCard from "~~/components/BetCard";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";

async function getBets(page: number, itemsPerPage: number = 6) {
  const res = await fetch(
    `/api/bets?page=${page}&itemsPerPage=${itemsPerPage}`,
  );
  if (!res.ok) {
    throw new Error("Could not fetch bets");
  }
  const json = await res.json();
  return json as Bet[];
}

function BetsOverview() {
  const { data, isLoading, error } = useScaffoldEventHistory({
    contractName: "BetMaker",
    eventName: "contracts::BetMaker::BetMaker::CryptoBetCreated",
    fromBlock: BigInt(process.env.NEXT_PUBLIC_EVENT_STARTING_BLOCK || "0"),
    blockData: true,
    transactionData: false,
    receiptData: false,
    /* watch: true, */
    enabled: true,
  });

  if (isLoading) return <BetsOverviewSkeletons />;
  if (error)
    return (
      <Alert className="w-2/4">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Could not fetch data</AlertTitle>
        <AlertDescription>Try to reload the page</AlertDescription>
      </Alert>
    );

  return (
    <>
      {data.length === 0 ? (
        <Alert className="w-2/4">
          <Rocket className="h-4 w-4" />
          <AlertTitle>No active bets</AlertTitle>
          <AlertDescription>
            Exciting betting opportunities are coming your way soon!
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid w-full grid-cols-[repeat(auto-fill,_380px)] justify-center gap-8">
        {data.map(({ args: market }, i) => {
          const bet = market.market as Bet;
          return <BetCard key={bet.bet_id} bet={bet} />;
        })}
      </div>
    </>
  );
}

export default BetsOverview;
