import React from "react";
import Image from "next/image";

import { BetsOverview } from "./BetsOverview";
import { FlipWords } from "../Uikit/components/ui/flip-words";
import { WobbleCard } from "../Uikit/components/ui/wobble-card";
import LinearGradient from "../Uikit/components/ui/linear-gradient";

function Home() {
  const words = ["better", "cute", "beautiful", "modern"];
  return (
    <div className=" min-h-screen flex justify-center px-4">
      {/*  <LinearGradient /> */}
      <div className=" mx-auto w-full max-w-7xl pt-12">
        {/*   Build
        <FlipWords words={words} /> <br />
        websites with Aceternity UI */}
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
      </div>
    </div>
  );
}

export default Home;
