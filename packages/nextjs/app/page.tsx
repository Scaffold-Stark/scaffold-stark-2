import React from "react";
import Image from "next/image";

import { InfiniteMovingCards } from "./Uikit/components/ui/infinite-moving-card";
import { BetsOverview } from "./BetsOverview";

function Home() {
  const items: {
    quote: string;
    image?: React.ReactNode;
  }[] = [
    {
      quote: "Crypto Bets",
      image: (
        <Image
          src={"/bitcoin-paysage2.jpg"}
          alt={"bitcoin"}
          width={450}
          height={50}
          className="h-full w-full "
        />
      ),
    },
    {
      quote: "Political bets",
      image: (
        <Image
          src={"/politics.jpg"}
          alt={"bitcoin"}
          width={450}
          height={50}
          className="h-full w-full "
        />
      ),
    },
    {
      quote: "Sports Bets",
      image: (
        <Image
          src={"/sports.png"}
          alt={"bitcoin"}
          width={626}
          height={432}
          className="h-full w-full "
        />
      ),
    },
    {
      quote: "Degens Bets",
      image: (
        <Image
          src={"/pepe.png"}
          alt={"bitcoin"}
          width={350}
          height={50}
          className="h-full w-full "
        />
      ),
    },
    {
      quote: "Crypto Bets",
      image: (
        <Image
          src={"/bitcoin-paysage2.jpg"}
          alt={"bitcoin"}
          width={450}
          height={50}
          className="h-full w-full "
        />
      ),
    },
    {
      quote: "Political bets",
      image: (
        <Image
          src={"/politics.jpg"}
          alt={"bitcoin"}
          width={450}
          height={50}
          className="h-full w-full "
        />
      ),
    },
    {
      quote: "Sports Bets",
      image: (
        <Image
          src={"/sports.png"}
          alt={"bitcoin"}
          width={626}
          height={432}
          className="h-full w-full "
        />
      ),
    },
    {
      quote: "Degens Bets",
      image: (
        <Image
          src={"/pepe.png"}
          alt={"bitcoin"}
          width={350}
          height={50}
          className="h-full w-full "
        />
      ),
    },
  ];
  return (
    <>
      <InfiniteMovingCards
        items={items}
        direction="right"
        speed="slow"
        className="!mb-20"
      />

      <BetsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full my-20"></div>
    </>
  );
}

export default Home;
