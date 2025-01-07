import { useAccount, useNetwork } from "@starknet-react/core";
import { Button } from "~~/app/Uikit/components/ui/button";
import { cn } from "~~/app/Uikit/lib/utils";
import { Bet } from "~~/types/bet";
import { motion } from "framer-motion";
import { calculatePercentage } from "~~/utils/scaffold-stark/common";
import AnimatedGradientText from "~~/app/Uikit/components/ui/animated-text";
import { formatUnits } from "ethers";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NimboraStrategy } from "~~/types/nimbora";
import { BetTokenImage, BetType, PositionType } from "~~/app/constants";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~~/app/Uikit/components/ui/dialog";
import { Label } from "~~/app/Uikit/components/ui/label";
import { Input } from "~~/app/Uikit/components/ui/input";
import ShineBorder from "~~/app/Uikit/components/ui/shine-border";
import { Swords } from "lucide-react";
import { Balance } from "./scaffold-stark";
import { CairoCustomEnum, shortString } from "starknet";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { isNolossBetVariant } from "~~/utils/starksight";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { SkeletonShort } from "~~/app/Uikit/components/ui/skeletons";

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
  const { address, status, chainId, isConnecting, ...props } = useAccount();
  const [amountEth, setAmountEth] = useState<number | null>(null);

  const betToken = shortString.decodeShortString(bet.bet_token.name) as
    | "Eth"
    | "Usdc";
  const betType = shortString.decodeShortString(bet.category).toUpperCase();
  const needConnection = !isConnecting && !address;
  const { data: betMakerInfos } = useDeployedContractInfo("BetMaker");
  const betTypeEnum = new CairoCustomEnum({
    [BetType.CRYPTO]: betType === "CRYPTO" ? "get_crypto_bet" : undefined,
    [BetType.SPORTS]: betType === "SPORTS" ? "get_sport_bet" : undefined,
    [BetType.OTHER]: betType === "OTHER" ? "value" : undefined,
  });

  const { data: betInfos, isLoading } = useScaffoldReadContract({
    contractName: "BetMaker",
    functionName: betTypeEnum.unwrap(),
    args: [Number(bet.bet_id)],
  });
  const isLoadingBetInfos = isLoading || !betInfos;

  const positionYesTypeEnum = new CairoCustomEnum({
    [PositionType.Yes]: "value",
    [PositionType.No]: undefined,
  });

  const positionNoTypeEnum = new CairoCustomEnum({
    [PositionType.Yes]: undefined,
    [PositionType.No]: "value",
  });

  const { sendAsync: voteYes } = useScaffoldMultiWriteContract({
    calls: [
      {
        contractName: "Eth",
        functionName: "approve",
        args: [betMakerInfos?.address, (amountEth ?? 0) * 10 ** 18],
      },
      {
        contractName: "BetMaker",
        functionName: "create_user_position",
        args: [
          BigInt(bet.bet_id),
          betTypeEnum,
          positionYesTypeEnum,
          (amountEth ?? 0) * 10 ** 18,
        ],
      },
    ],
  });
  const { sendAsync: voteNo } = useScaffoldMultiWriteContract({
    calls: [
      {
        contractName: "Eth",
        functionName: "approve",
        args: [betMakerInfos?.address, (amountEth ?? 0) * 10 ** 18],
      },
      {
        contractName: "BetMaker",
        functionName: "create_user_position",
        args: [
          BigInt(bet.bet_id),
          betTypeEnum,
          positionNoTypeEnum,
          (amountEth ?? 0) * 10 ** 18,
        ],
      },
    ],
  });

  const isNoLossMarket = useMemo(() => {
    return isNolossBetVariant(bet.yield_strategy.activeVariant());
  }, [bet.yield_strategy]);

  /* const { isPending, error, data } = useQuery<NimboraStrategy[], Error>({
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
  }); */

  const apr = useMemo(() => {
    /*  if (bet.yield_strategy_type === 1) {
      const nimboraApr = data?.find(
        (strategie) => strategie.symbol === bet.yield_strategy_symbol,
      )?.apr;

      return nimboraApr;
    } */
    return 22;
  }, [bet.yield_strategy]);

  return (
    <div className="relative h-full w-full">
      {betInfos && !betInfos.is_active && (
        <div className="absolute inset-0 z-10 flex items-center justify-center blur-none">
          <span className="rounded-full bg-black bg-opacity-50 px-4 py-2 font-semibold text-white">
            Closed
          </span>
        </div>
      )}
      <div
        className={cn(
          "group/bento relative row-span-1 flex h-full w-full flex-col justify-between space-y-4 rounded-xl border border-border bg-card p-6 shadow-input transition duration-200 hover:shadow-xl",
          betInfos && !betInfos.is_active
            ? "pointer-events-none blur-sm"
            : null,
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
              {isLoadingBetInfos ? (
                <SkeletonShort />
              ) : (
                `Prize Pool ${parseFloat(formatUnits(BigInt(betInfos.total_money_betted) || "0")).toFixed(4)} `
              )}
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
        {isLoadingBetInfos ? (
          <div className="flex h-full animate-pulse space-x-4">
            <div className="flex w-full items-center space-y-6">
              <div className="h-32 w-full rounded bg-slate-300"></div>
            </div>
          </div>
        ) : (
          <BetStats
            percentageYes={calculatePercentage(
              BigInt(betInfos.outcomes.outcome_yes.bought_amount),
              BigInt(betInfos.total_money_betted),
            )}
            percentageNo={calculatePercentage(
              BigInt(betInfos.outcomes.outcome_no.bought_amount),
              BigInt(betInfos.total_money_betted),
            )}
          />
        )}
        <div className="duration-20 w-[160%] self-center transition">
          {/*  {icon} */}
          <div className="flex w-full justify-evenly">
            <span className="font-bold">Yes</span>
            <span className="font-bold">No</span>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant={"secondary"} className="cursor-pointer">
              Make Your Move
            </Button>
          </DialogTrigger>
          <DialogContent className="lg:max-w-2xl">
            <DialogHeader className="max-w-[29rem] lg:max-w-2xl">
              <DialogTitle>{bet.name}</DialogTitle>
              <DialogDescription>{bet.description}</DialogDescription>
            </DialogHeader>
            {isLoadingBetInfos ? (
              <div className="flex h-full animate-pulse space-x-4">
                <div className="flex w-full items-center">
                  <div className="h-48 w-full rounded bg-slate-300"></div>
                </div>
              </div>
            ) : (
              <div className="max-w-[29rem] lg:max-w-2xl">
                <div>
                  <div className="flex items-center justify-center space-x-4 rounded-lg border p-4">
                    <div className="flex w-1/2 flex-col items-center justify-center rounded-lg p-4">
                      <h2 className="text-sm text-white">Total Yes</h2>
                      <p className="text-2xl font-bold text-primary">
                        {parseFloat(
                          formatUnits(
                            betInfos.outcomes.outcome_yes.bought_amount,
                          ),
                        ).toFixed(4)}
                        &nbsp;{betToken.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex h-8 w-9 items-center justify-center">
                      <Swords className="text-primary" />
                    </div>
                    <div className="flex w-1/2 flex-col items-center justify-center rounded-lg p-4">
                      <h2 className="text-sm text-white">Total No</h2>
                      <p className="text-2xl font-bold text-destructive">
                        {parseFloat(
                          formatUnits(
                            betInfos.outcomes.outcome_no.bought_amount,
                          ),
                        ).toFixed(4)}
                        &nbsp;{betToken.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {isNoLossMarket ? (
                  <div className="flex space-x-2">
                    <ShineBorder
                      className="mt-3 w-full !bg-transparent text-center text-2xl font-bold capitalize"
                      color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                    >
                      <div className="flex flex-col items-center justify-center rounded-lg p-4">
                        <h2 className="text-sm text-white">Prize Pool</h2>
                        <p className="text-2xl font-bold text-primary">
                          {parseFloat(
                            formatUnits(betInfos.total_money_betted),
                          ).toFixed(4)}
                          &nbsp;{betToken.toUpperCase()}
                        </p>
                      </div>
                    </ShineBorder>
                    <ShineBorder
                      className="mt-3 w-full !bg-transparent text-center text-2xl font-bold capitalize"
                      color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                    >
                      <div className="flex flex-col items-center justify-center rounded-lg p-4">
                        <h2 className="text-sm text-white">APR</h2>
                        <p className="text-2xl font-bold text-primary">
                          {"22%"}
                        </p>
                      </div>
                    </ShineBorder>
                  </div>
                ) : (
                  <ShineBorder
                    className="mt-3 w-full !bg-transparent text-center text-2xl font-bold capitalize"
                    color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                  >
                    <div className="flex flex-col items-center justify-center rounded-lg p-4">
                      <h2 className="text-sm text-white">Prize Pool</h2>
                      <p className="text-2xl font-bold text-primary">
                        {parseFloat(
                          formatUnits(betInfos.total_money_betted),
                        ).toFixed(4)}
                        &nbsp;{betToken.toUpperCase()}
                      </p>
                    </div>
                  </ShineBorder>
                )}
                <div className="mt-6 space-y-4">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label htmlFor="bet-amount">Enter Bet Amount</Label>
                      <Label
                        htmlFor="bet-amount"
                        className="flex text-muted-foreground"
                      >
                        {needConnection ? (
                          "Please connect your wallet."
                        ) : (
                          <div className="flex items-center justify-center">
                            {`Balance:`} <Balance address={address} />
                          </div>
                        )}
                      </Label>
                    </div>
                    <Input
                      id="bet-amount"
                      type="number"
                      placeholder={`0,00 ${betToken.toUpperCase()}`}
                      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={amountEth ?? ""}
                      onChange={(e) => setAmountEth(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex gap-4">
                    <DialogClose className="w-full flex-1" asChild>
                      <Button
                        className="w-full flex-1"
                        disabled={needConnection}
                        onClick={() => {
                          voteYes();
                          setAmountEth(null);
                        }}
                      >
                        {needConnection ? "Connect Wallet" : "Vote Yes"}
                      </Button>
                    </DialogClose>
                    <DialogClose className="w-full flex-1" asChild>
                      <Button
                        variant={"destructive"}
                        disabled={needConnection}
                        className="w-full flex-1"
                        onClick={() => {
                          voteNo();
                          setAmountEth(null);
                        }}
                      >
                        {needConnection ? "Connect Wallet" : "Vote No"}
                      </Button>
                    </DialogClose>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default BetCard;
