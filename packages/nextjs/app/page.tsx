"use client";

import type { NextPage } from "next";
import { useAccount } from "@starknet-react/core";

const Home: NextPage = () => {
  const connectedAddress = useAccount();

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-[90%] md:w-[75%]"></div>
      </div>
    </>
  );
};

export default Home;
