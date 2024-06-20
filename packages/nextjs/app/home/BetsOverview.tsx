"use client";

import React from "react";

import { motion } from "framer-motion";
import { Bitcoin } from "lucide-react";

import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import {
  formatDate,
  parseBitcoinPriceToNumber,
} from "~~/utils/scaffold-stark/common";
import BitcoinPriceBet from "~~/components/Bets/BitcoinPriceBet";
import { formatUnits } from "ethers";
import { BentoGrid, BentoGridItem } from "../Uikit/components/ui/bento-grid";
import { cn } from "../Uikit/lib/utils";
import { title } from "process";

const Skeleton = () => {
  const variants = {
    initial: {
      height: 0,
    },
    animate: {
      height: "100%",
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      height: ["0%", "100%"],
      transition: {
        duration: 2,
      },
    },
  };
  const arr = new Array(2).fill(0);
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] space-y-2 items-end self-center space-x-8"
    >
      {arr.map((_, i) => (
        <motion.div
          key={"skelenton-two" + i}
          variants={variants}
          style={{
            maxHeight: i === 0 ? "100" + "%" : "50" + "%",
          }}
          className={`flex flex-row rounded p-2 items-center space-x-2 w-full h-4 ${i === 0 ? "bg-primary" : "bg-destructive"}`}
        ></motion.div>
      ))}
    </motion.div>
  );
};

export function BetsOverview() {
  const { data: bitcoinPriceData, isLoading } = useScaffoldReadContract({
    contractName: "BitcoinPrice",
    functionName: "get_current_bet",
    args: [],
  });

  const items = [
    {
      headerTitle: (
        <span className="self-center">
          {`Prize Pool ${parseFloat(formatUnits(bitcoinPriceData?.total_amount || "0")).toFixed(4)}`}{" "}
          <span className="text-[0.8em] font-bold ml-1">{"ETH"}</span>
        </span>
      ),
      title: `Crypto Price Bet`,
      description: (
        <span className="text-sm">
          {`Bitcoin above  ${parseBitcoinPriceToNumber(
            bitcoinPriceData?.reference_token_price
          )} before ${formatDate(bitcoinPriceData?.end_date)}?`}
        </span>
      ),
      header: <Skeleton />,
      className: "md:col-span-1",
      icon: <Bitcoin className="h-4 w-4 text-neutral-500 mt-5" />,
      isLoading: isLoading,
      modelTitle: `Bitcoin above  ${parseBitcoinPriceToNumber(
        bitcoinPriceData?.reference_token_price
      )} before ${formatDate(bitcoinPriceData?.end_date)}?`,
      modalContent: (
        <BitcoinPriceBet
          bitcoinPriceData={bitcoinPriceData}
          isLoading={isLoading}
        />
      ),
    },
    {
      title: "Automated Proofreading",
      description: (
        <span className="text-sm">
          Let AI handle the proofreading of your documents.
        </span>
      ),
      header: <Skeleton />,
      className: "md:col-span-1",
      icon: <Bitcoin className="h-4 w-4 text-neutral-500 mt-5" />,
    },
    {
      title: "Automated Proofreading",
      description: (
        <span className="text-sm">
          Let AI handle the proofreading of your documents.
        </span>
      ),
      header: <Skeleton />,
      className: "md:col-span-1",
      icon: <Bitcoin className="h-4 w-4 text-neutral-500 mt-5" />,
    },
    {
      title: "Automated Proofreading",
      description: (
        <span className="text-sm">
          Let AI handle the proofreading of your documents.
        </span>
      ),
      header: <Skeleton />,
      className: "md:col-span-1",
      icon: <Bitcoin className="h-4 w-4 text-neutral-500 mt-5" />,
    },

    {
      title: "Automated Proofreading",
      description: (
        <span className="text-sm">
          Let AI handle the proofreading of your documents.
        </span>
      ),
      header: <Skeleton />,
      className: "md:col-span-1",
      icon: <Bitcoin className="h-4 w-4 text-neutral-500 mt-5" />,
    },
  ];
  return (
    <BentoGrid className="mx-auto md:auto-rows-[24rem]">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn("[&>p:text-lg]", item.className)}
          icon={item.icon}
          isLoading={item.isLoading}
          headerTitle={item.headerTitle}
          modelTitle={item.modelTitle}
          modalContent={item.modalContent}
        />
      ))}
    </BentoGrid>
  );
}
