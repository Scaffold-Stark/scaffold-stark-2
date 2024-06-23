"use client";

import React from "react";

import { motion } from "framer-motion";
import { Bitcoin, ChevronRight } from "lucide-react";

import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import {
  calculatePercentage,
  formatDate,
  parseStarkPriceToNumber,
  parseTokenPriceToNumber,
} from "~~/utils/scaffold-stark/common";
import BitcoinPriceBet from "~~/components/Bets/BitcoinPriceBet";
import { formatUnits } from "ethers";

import { title } from "process";
import { BentoGrid, BentoGridItem } from "./Uikit/components/ui/bento-grid";
import { cn } from "./Uikit/lib/utils";
import AnimatedGradientText from "./Uikit/components/ui/animated-text";
import EtherPriceBet from "~~/components/Bets/EtherPriceBet";
import StarkPriceBet from "~~/components/Bets/StarkPriceBet";

const Skeleton = ({
  percentageYes,
  percentageNo,
}: {
  percentageYes: number;
  percentageNo: number;
}) => {
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
            maxHeight: i === 0 ? percentageYes + "%" : percentageNo + "%",
          }}
          className={`flex flex-row rounded p-3 items-center justify-center space-x-2 w-full h-4 ${i === 0 ? "bg-primary" : "bg-destructive"}`}
        >
          {i === 0
            ? Math.round(percentageYes) + "%"
            : Math.round(percentageNo) + "%"}
        </motion.div>
      ))}
    </motion.div>
  );
};

export function BetsOverview() {
  const { data: bitcoinPriceData, isLoading: isLoadingBitcoinPrice } =
    useScaffoldReadContract({
      contractName: "BitcoinPrice",
      functionName: "get_current_bet",
      args: undefined,
    });

  const { data: etherPriceData, isLoading: isLoadingEtherPrice } =
    useScaffoldReadContract({
      contractName: "EtherPrice",
      functionName: "get_current_bet",
      args: undefined,
    });

  const { data: starkPriceData, isLoading: isLoadingStarkPrice } =
    useScaffoldReadContract({
      contractName: "StarkPrice",
      functionName: "get_current_bet",
      args: undefined,
    });

  const isLoading =
    isLoadingBitcoinPrice || isLoadingEtherPrice || isLoadingStarkPrice;
  const items = [
    {
      headerTitle: (
        <AnimatedGradientText>
          🎉 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
          <span
            className={cn(
              `inline animate-gradient bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent bg-foreground`,
            )}
          >
            {`Prize Pool ${parseFloat(formatUnits(bitcoinPriceData?.total_amount || "0")).toFixed(4)} ETH`}
          </span>
        </AnimatedGradientText>
      ),
      title: `Crypto Price Bet`,
      description: (
        <span className="text-sm">
          {`Bitcoin above  ${parseTokenPriceToNumber(
            bitcoinPriceData?.reference_token_price,
          )} before ${formatDate(bitcoinPriceData?.end_date)}?`}
        </span>
      ),
      header: (
        <Skeleton
          percentageYes={calculatePercentage(
            bitcoinPriceData?.total_amount_yes,
            bitcoinPriceData?.total_amount,
          )}
          percentageNo={calculatePercentage(
            bitcoinPriceData?.total_amount_no,
            bitcoinPriceData?.total_amount,
          )}
        />
      ),
      className: "md:col-span-1",
      modelTitle: `Bitcoin above  ${parseTokenPriceToNumber(
        bitcoinPriceData?.reference_token_price,
      )} before ${formatDate(bitcoinPriceData?.end_date)}?`,
      modalContent: (
        <BitcoinPriceBet
          bitcoinPriceData={bitcoinPriceData}
          isLoading={isLoadingBitcoinPrice}
        />
      ),
    },
    {
      headerTitle: (
        <AnimatedGradientText>
          🎉 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
          <span
            className={cn(
              `inline animate-gradient bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent bg-foreground`,
            )}
          >
            {`Prize Pool ${parseFloat(formatUnits(etherPriceData?.total_amount || "0")).toFixed(4)} ETH`}
          </span>
        </AnimatedGradientText>
      ),
      title: `Crypto Price Bet`,
      description: (
        <span className="text-sm">
          {`Ether above  ${parseTokenPriceToNumber(
            etherPriceData?.reference_token_price,
          )} before ${formatDate(etherPriceData?.end_date)}?`}
        </span>
      ),
      header: (
        <Skeleton
          percentageYes={calculatePercentage(
            etherPriceData?.total_amount_yes,
            etherPriceData?.total_amount,
          )}
          percentageNo={calculatePercentage(
            etherPriceData?.total_amount_no,
            etherPriceData?.total_amount,
          )}
        />
      ),
      className: "md:col-span-1",
      modelTitle: `ether above  ${parseTokenPriceToNumber(
        etherPriceData?.reference_token_price,
      )} before ${formatDate(etherPriceData?.end_date)}?`,
      modalContent: (
        <EtherPriceBet
          etherPriceData={etherPriceData}
          isLoading={isLoadingEtherPrice}
        />
      ),
    },
    {
      headerTitle: (
        <AnimatedGradientText>
          🎉 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
          <span
            className={cn(
              `inline animate-gradient bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent bg-foreground`,
            )}
          >
            {`Prize Pool ${parseFloat(formatUnits(starkPriceData?.total_amount || "0")).toFixed(4)} ETH`}
          </span>
        </AnimatedGradientText>
      ),
      title: `Crypto Price Bet`,
      description: (
        <span className="text-sm">
          {`Stark above  ${parseStarkPriceToNumber(
            starkPriceData?.reference_token_price,
          ).toFixed(2)} before ${formatDate(starkPriceData?.end_date)}?`}
        </span>
      ),
      header: (
        <Skeleton
          percentageYes={calculatePercentage(
            starkPriceData?.total_amount_yes,
            starkPriceData?.total_amount,
          )}
          percentageNo={calculatePercentage(
            starkPriceData?.total_amount_no,
            starkPriceData?.total_amount,
          )}
        />
      ),
      className: "md:col-span-1",
      modelTitle: `Stark above  ${parseStarkPriceToNumber(
        starkPriceData?.reference_token_price,
      ).toFixed(2)} before ${formatDate(starkPriceData?.end_date)}?`,
      modalContent: (
        <StarkPriceBet
          starkPriceData={starkPriceData}
          isLoading={isLoadingStarkPrice}
        />
      ),
    },
    /* Coming soon bets */
    {
      headerTitle: (
        <AnimatedGradientText>
          🎉 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
          <span
            className={cn(
              `inline animate-gradient bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent bg-foreground`,
            )}
          >
            {`Prize Pool 999999 ETH`}
          </span>
        </AnimatedGradientText>
      ),
      title: `Degen Bet`,
      description: (
        <span className="text-sm">{`Eli Ben-Sasson president of the SEC ?`}</span>
      ),
      header: <Skeleton percentageYes={70} percentageNo={30} />,
      className: "md:col-span-1",
      modelTitle: `Eli Ben-Sasson president of the SEC ?`,
      modalContent: <>Coming soon...</>,
    },
    {
      headerTitle: (
        <AnimatedGradientText>
          🎉 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
          <span
            className={cn(
              `inline animate-gradient bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent bg-foreground`,
            )}
          >
            {`Prize Pool 13490 ETH`}
          </span>
        </AnimatedGradientText>
      ),
      title: `Sport Bet`,
      description: (
        <span className="text-sm">{`France winner of the Europa league ?`}</span>
      ),
      header: <Skeleton percentageYes={100} percentageNo={0} />,
      className: "md:col-span-1",
      modelTitle: `France winner of the Europa league ?`,
      modalContent: <>Coming soon...</>,
    },
    {
      headerTitle: (
        <AnimatedGradientText>
          🎉 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
          <span
            className={cn(
              `inline animate-gradient bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent bg-foreground`,
            )}
          >
            {`Prize Pool 190 ETH`}
          </span>
        </AnimatedGradientText>
      ),
      title: `Political bet`,
      description: (
        <span className="text-sm">{`Donald Trump wins the Presidential Election?`}</span>
      ),
      header: <Skeleton percentageYes={45} percentageNo={55} />,
      className: "md:col-span-1",
      modelTitle: `Donald Trump wins the Presidential Election?`,
      modalContent: <>Coming soon...</>,
    },
  ];
  return (
    <BentoGrid className="mx-auto md:auto-rows-[24rem]" isLoading={isLoading}>
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn("[&>p:text-lg]", item.className)}
          headerTitle={item.headerTitle}
          modelTitle={item.modelTitle}
          modalContent={item.modalContent}
        />
      ))}
    </BentoGrid>
  );
}
