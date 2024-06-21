import React from "react";
import Image from "next/image";

import { InfiniteMovingCards } from "./Uikit/components/ui/infinite-moving-card";
import { BetsOverview } from "./BetsOverview";

function Home() {
  const items: {
    quote: string;
    name: string;
    title: string;
  }[] = [
    {
      quote:
        "The only limit to our realization of tomorrow is our doubts of today.",
      name: "Franklin D. Roosevelt",
      title: "32nd President of the United States",
    },
    {
      quote:
        "Success usually comes to those who are too busy to be looking for it.",
      name: "Henry David Thoreau",
      title: "Philosopher and Author",
    },
    {
      quote: "Don't watch the clock; do what it does. Keep going.",
      name: "Sam Levenson",
      title: "Humorist and Writer",
    },
    {
      quote:
        "The future belongs to those who believe in the beauty of their dreams.",
      name: "Eleanor Roosevelt",
      title: "Former First Lady of the United States",
    },
    {
      quote: "The best way to predict the future is to create it.",
      name: "Peter Drucker",
      title: "Management Consultant and Author",
    },
    {
      quote: "You miss 100% of the shots you don’t take.",
      name: "Wayne Gretzky",
      title: "Professional Hockey Player",
    },
    {
      quote: "I have not failed. I've just found 10,000 ways that won't work.",
      name: "Thomas Edison",
      title: "Inventor and Businessman",
    },
    {
      quote:
        "The road to success and the road to failure are almost exactly the same.",
      name: "Colin R. Davis",
      title: "Conductor",
    },
    {
      quote: "Opportunities don't happen, you create them.",
      name: "Chris Grosser",
      title: "Photographer and Entrepreneur",
    },
    {
      quote: "Don't be afraid to give up the good to go for the great.",
      name: "John D. Rockefeller",
      title: "Business Magnate and Philanthropist",
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full my-20">
        {/* <WobbleCard
            containerClassName="col-span-1 lg:col-span-2 h-full bg-[#f2a900e3] min-h-[500px] lg:min-h-[300px]"
            className=""
          >
            <div className="max-w-xs">
              <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                OP_CAT Myth or reality?
              </h2>
              <p className="mt-4 text-left  text-base/6 text-neutral-200">
                The one thing required to make Starknet the first L2. Will It
                really happen and when?
              </p>
            </div>
            <Image
              src="/bitcoin1.png"
              width={500}
              height={500}
              alt="bitcoin token image"
              className="absolute -right-4 lg:-right-[30%] grayscale filter -bottom-52 object-contain rounded-2xl"
            />
          </WobbleCard>
          <WobbleCard containerClassName="col-span-1 min-h-[300px]">
            <h2 className="max-w-80  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
              Will we have more than 8 users on Starknet ?
            </h2>
            <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
              If someone yells ”SCAM”, <br /> Then say ”Want to bet?”
            </p>
          </WobbleCard>
          <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
            <div className="max-w-sm">
              <h2 className="max-w-sm md:max-w-lg  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Is there going to be the Stark token ETF?
              </h2>
              <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
                As main tokens starts to get their ETFs validated, everyone is
                waiting for the stark token so that the token will pump.
              </p>
            </div>
            <Image
              src="/stark.png"
              width={400}
              height={400}
              alt="stark token image"
              className="absolute -right-10 md:-right-[40%] lg:-right-[15%] -bottom-44 object-contain rounded-2xl"
            />
          </WobbleCard> */}
      </div>
    </>
  );
}

export default Home;
