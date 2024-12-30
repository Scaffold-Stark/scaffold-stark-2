"use client";

import { InfiniteMovingCards } from "./Uikit/components/ui/infinite-moving-card";
import { CryptoBetsOverview } from "./CryptoBetsOverview";
import { useQuery } from "@tanstack/react-query";
import { Bet } from "~~/types/bet";
import { movingCardItems } from "./constants";
import BetsOverview from "./BetsOverview";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";

function Home() {
  return (
    <>
      <InfiniteMovingCards
        items={movingCardItems}
        direction="right"
        speed="slow"
        className="!mb-20"
      />
      {/*  <HooksExample /> */}
      <BetsOverview />
    </>
  );
}

export default Home;
