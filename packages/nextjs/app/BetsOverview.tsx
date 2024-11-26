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
  const { ref, inView } = useInView({
    /* Optional options */
    threshold: 0,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["bets"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getBets(pageParam),
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (!(lastPage && lastPage.length > 0)) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
      if (firstPageParam <= 1) {
        return undefined;
      }
      return firstPageParam - 1;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView]);

  if (status === "pending") return <BetsOverviewSkeletons />;
  if (status === "error")
    return (
      <Alert className="w-2/4">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Could not fetch data</AlertTitle>
        <AlertDescription>Try to reload the page</AlertDescription>
      </Alert>
    );

  return (
    <>
      {data.pages[0].length === 0 ? (
        <Alert className="w-2/4">
          <Rocket className="h-4 w-4" />
          <AlertTitle>No active bets</AlertTitle>
          <AlertDescription>
            Exciting betting opportunities are coming your way soon!
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid w-full grid-cols-[repeat(auto-fill,_380px)] justify-center gap-8">
        {data.pages.map((bets, i) => (
          <React.Fragment key={i}>
            {bets.map((bet) => (
              <BetCard key={bet.bet_id} bet={bet} />
            ))}
          </React.Fragment>
        ))}

        {isFetchingNextPage ? (
          <BetOverviewSkeletons />
        ) : hasNextPage ? null : (
          ""
        )}
      </div>

      <div ref={ref}></div>
    </>
  );
}

export default BetsOverview;
