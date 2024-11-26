import { Button } from "~~/app/Uikit/components/ui/button";
import { cn } from "~~/app/Uikit/lib/utils";
import { Bet } from "~~/types/bet";
import { motion } from "framer-motion";
import { calculatePercentage } from "~~/utils/scaffold-stark/common";
import AnimatedGradientText from "~~/app/Uikit/components/ui/animated-text";
import { formatUnits } from "ethers";
import Image from "next/image";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { NimboraStrategy } from "~~/types/nimbora";
import { BetTokenImage } from "~~/app/constants";

const BetStats = ({
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
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex h-full min-h-[6rem] w-full items-end space-x-8 space-y-2 self-center"
    >
      {arr.map((_, i) => (
        <motion.div
          key={"skelenton-two" + i}
          variants={variants}
          style={{
            maxHeight: i === 0 ? percentageYes + "%" : percentageNo + "%",
          }}
          className={`flex h-4 w-full flex-row items-center justify-center space-x-2 rounded p-3 ${i === 0 ? "bg-primary" : "bg-destructive"}`}
        >
          {i === 0
            ? Math.round(percentageYes) + "%"
            : Math.round(percentageNo) + "%"}
        </motion.div>
      ))}
    </motion.div>
  );
};

function BetCard({ bet }: { bet: Bet }) {
  const isNoLossMarket = useMemo(() => {
    if (bet.yield_strategy_type === 0) return false;
    return true;
  }, [bet.yield_strategy_type]);

  const { isPending, error, data } = useQuery<NimboraStrategy[], Error>({
    queryKey: ["NimboraStrategys"],
    queryFn: () =>
      fetch("https://backend.nimbora.io/yield-dex/strategies", {}).then(
        (res) => {
          if (!res.ok) {
            throw new Error("Network response was not ok");
          }
          return res.json();
        },
      ),
  });

  const apr = useMemo(() => {
    if (bet.yield_strategy_type === 1) {
      const nimboraApr = data?.find(
        (strategie) => strategie.symbol === bet.yield_strategy_symbol,
      )?.apr;

      return nimboraApr;
    }
    return 0;
  }, [bet.yield_strategy_type]);

  const betToken = bet.bet_token_name as "Eth" | "Usdc";
  return (
    <div
      className={cn(
        "group/bento relative row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-border bg-card p-6 shadow-input transition duration-200 hover:shadow-xl",
      )}
    >
      <div className="space-y-2">
        <div className="font-sans text-xl font-bold text-foreground">
          {bet.name}
        </div>
        <div className="!mb-6 font-sans text-xs font-normal text-muted-foreground">
          {bet.description}
        </div>
      </div>
      <div className="flex space-x-2">
        <AnimatedGradientText className="flex-1">
          🎉 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
          <span
            className={cn(
              `animate-gradient flex bg-foreground bg-gradient-to-r from-primary to-primary bg-clip-text text-center text-transparent`,
            )}
          >
            {`Prize Pool ${parseFloat(formatUnits(BigInt(bet.total_money_betted) || "0")).toFixed(4)} `}
          </span>
          <Image
            src={BetTokenImage[betToken]}
            alt={"starksight"}
            className="ml-1"
            width={20}
            height={20}
          />
        </AnimatedGradientText>
        {isNoLossMarket ? (
          <AnimatedGradientText className="flex-1">
            ✨ <hr className="mx-2 h-4 w-[1px] shrink-0 bg-border" />{" "}
            <span
              className={cn(
                `animate-gradient inline bg-foreground bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent`,
              )}
            >
              {`APR ${apr}%`}
            </span>
          </AnimatedGradientText>
        ) : null}
      </div>
      <BetStats
        percentageYes={calculatePercentage(
          BigInt(bet.outcome_yes_bought_amount),
          BigInt(bet.total_money_betted),
        )}
        percentageNo={calculatePercentage(
          BigInt(bet.outcome_no_bought_amount),
          BigInt(bet.total_money_betted),
        )}
      />
      <div className="duration-20 w-[160%] self-center transition">
        {/*  {icon} */}
        <div className="flex w-full justify-evenly">
          <span className="font-bold">Yes</span>
          <span className="font-bold">No</span>
        </div>
      </div>
      <Button
        variant={"secondary"}
        className="cursor-pointer"
        /* onClick={() => setModalOpen(true)} */
      >
        Make Your Move
      </Button>
    </div>
  );
}

export default BetCard;
