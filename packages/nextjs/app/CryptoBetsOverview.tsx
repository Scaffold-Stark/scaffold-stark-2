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
import { shortString } from "starknet";
import CryptoPriceBet from "~~/components/Bets/CryptoPriceBet";

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

export function CryptoBetsOverview() {
  const {
    data: allCryptoBets,
    isLoading,
    ...rest
  } = useScaffoldReadContract({
    contractName: "BetCryptoMaker",
    functionName: "getAllBets",
    args: undefined,
  });

  //const shortStr = shortString.encodeShortString("Cryptos");
  //console.log(shortString.decodeShortString(shortStr));

  const items = allCryptoBets
    ? [
        ...allCryptoBets,
        {
          category: "Crypto Price bet",
          description: "Bitcoin above 65345 on July 7?",
          id: 3n,
          is_bet_ended: false,
          name: "Bitcoin above 65345 on July 7?",
          reference_token_price: 349956000000n,
          total_bet_amount: 28365000000000000000000n,
          total_bet_no_amount: 8650000000000000000000n,
          total_bet_yes_amount: 19909909999999999999999n,
          total_shares_amount: 19693613846543474n,
          isFake: true,
        },
        {
          category: "Degen bet",
          description: "Eli Ben-Sasson president of the SEC ?",
          id: 3n,
          is_bet_ended: false,
          name: "Eli Ben-Sasson president of the SEC ?",
          reference_token_price: 349956000000n,
          total_bet_amount: 28365000000000000000000n,
          total_bet_no_amount: 8650000000000000000000n,
          total_bet_yes_amount: 19909909999999999999999n,
          total_shares_amount: 19693613846543474n,
          isFake: true,
        },
        {
          category: "Sport bet",
          description: "France winner of the Europa league ?",
          id: 3n,
          is_bet_ended: false,
          name: "France winner of the Europa league ?",
          reference_token_price: 349956000000n,
          total_bet_amount: 98365000000000000000000n,
          total_bet_no_amount: 0n,
          total_bet_yes_amount: 98365000000000000000000n,
          total_shares_amount: 19693613846543474n,
          isFake: true,
        },
        {
          category: "Politic bet",
          description: "Donald Trump wins the Presidential Election?",
          id: 3n,
          is_bet_ended: false,
          name: "Donald Trump wins the Presidential Election?",
          reference_token_price: 349956000000n,
          total_bet_amount: 28365000000000000000000n,
          total_bet_no_amount: 19909909999999999999999n,
          total_bet_yes_amount: 8650000000000000000000n,
          total_shares_amount: 19693613846543474n,
          isFake: true,
        },
      ]
    : [];

  return (
    <BentoGrid className="mx-auto md:auto-rows-[24rem]" isLoading={isLoading}>
      {!isLoading && items.length === 0 ? "No bets ongoing." : null}
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={
            item.isFake
              ? item.category
              : shortString.decodeShortString(item.category)
          }
          description={item.description}
          header={
            <Skeleton
              percentageYes={calculatePercentage(
                item?.total_bet_yes_amount,
                item?.total_bet_amount,
              )}
              percentageNo={calculatePercentage(
                item?.total_bet_no_amount,
                item?.total_bet_amount,
              )}
            />
          }
          className={cn("[&>p:text-lg]", item.className)}
          headerTitle={
            <AnimatedGradientText>
              🎉 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
              <span
                className={cn(
                  `inline animate-gradient bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent bg-foreground`,
                )}
              >
                {`Prize Pool ${parseFloat(formatUnits(item?.total_bet_amount || "0")).toFixed(4)} ETH`}
              </span>
            </AnimatedGradientText>
          }
          modelTitle={item.description}
          modalContent={
            item.isFake ? (
              "coming soon"
            ) : (
              <CryptoPriceBet cryptoPriceData={item} isLoading={isLoading} />
            )
          }
        />
      ))}
    </BentoGrid>
  );
}
