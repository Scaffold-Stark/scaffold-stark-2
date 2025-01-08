"use client";

import { InfiniteMovingCards } from "./Uikit/components/ui/infinite-moving-card";
import { movingCardItems } from "./constants";
import BetsOverview from "./BetsOverview";

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
