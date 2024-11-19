import { useAccount, useNetwork } from "@starknet-react/core";
import { Address as AddressType } from "@starknet-react/chains";
import React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~~/app/Uikit/components/ui/card";
import { Balance } from "../scaffold-stark";
import {
  createContractCall,
  useScaffoldMultiWriteContract,
} from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { formatUnits } from "ethers";
import { Button } from "~~/app/Uikit/components/ui/button";
import { Input } from "~~/app/Uikit/components/ui/input";
import { Label } from "~~/app/Uikit/components/ui/label";
import { Swords } from "lucide-react";
import ShineBorder from "~~/app/Uikit/components/ui/shine-border";

const SkeletonShort = () => {
  return (
    <div className="flex animate-pulse space-x-4">
      <div className="flex items-center space-y-6">
        <div className="h-3 w-28 rounded bg-slate-300"></div>
      </div>
    </div>
  );
};

type BitcoinPriceBetProps = { bitcoinPriceData: any; isLoading: boolean };

function BitcoinPriceBet({
  bitcoinPriceData,
  isLoading,
}: BitcoinPriceBetProps) {
  const { address, status, chainId, ...props } = useAccount();
  const [amountEth, setAmountEth] = React.useState(0);
  const { data } = useDeployedContractInfo("BitcoinPrice");
  const { writeAsync: writeAsyncYes } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall("Eth", "approve", [
        data?.address,
        amountEth * 10 ** 18,
      ]),
      createContractCall("BitcoinPrice", "vote_yes", [amountEth * 10 ** 18]),
    ],
  });
  const { writeAsync: writeAsyncNo } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall("Eth", "approve", [
        data?.address,
        amountEth * 10 ** 18,
      ]),
      createContractCall("BitcoinPrice", "vote_no", [amountEth * 10 ** 18]),
    ],
  });

  return (
    <div>
      <div>
        {isLoading ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center justify-between">
                <span>Prize Pool</span>
                <span className="font-medium">
                  <SkeletonShort />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Highest Bet</span>
                <span className="font-medium">
                  <SkeletonShort />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Prize Pool</span>
                <span className="font-medium text-green-500">
                  <SkeletonShort />
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center space-x-4 rounded-lg border p-4">
            <div className="flex w-1/2 flex-col items-center justify-center rounded-lg p-4">
              <h2 className="text-sm text-white">Total Yes</h2>
              <p className="text-2xl font-bold text-primary">
                {parseFloat(
                  formatUnits(bitcoinPriceData?.total_amount_yes),
                ).toFixed(4)}
                &nbsp;ETH
              </p>
            </div>
            <div className="flex h-8 w-9 items-center justify-center">
              <Swords className="text-primary" />
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg p-4">
              <h2 className="text-sm text-white">Total No</h2>
              <p className="text-2xl font-bold text-destructive">
                {parseFloat(
                  formatUnits(bitcoinPriceData?.total_amount_no),
                ).toFixed(4)}
                &nbsp;ETH
              </p>
            </div>
          </div>
        )}
      </div>

      <ShineBorder
        className="mt-3 w-full !bg-transparent text-center text-2xl font-bold capitalize"
        color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
      >
        <div className="flex flex-col items-center justify-center rounded-lg p-4">
          <h2 className="text-sm text-white">Prize Pool</h2>
          <p className="text-2xl font-bold text-primary">
            {parseFloat(formatUnits(bitcoinPriceData?.total_amount)).toFixed(4)}
            &nbsp;ETH
          </p>
        </div>
      </ShineBorder>

      <div className="mt-6 space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between">
            <Label htmlFor="bet-amount">Enter Bet Amount</Label>
            <Label htmlFor="bet-amount" className="flex text-muted-foreground">
              {`Balance `}&nbsp;
              <Balance address={address as AddressType} />
            </Label>
          </div>
          <Input
            id="bet-amount"
            type="number"
            placeholder="0.00 ETH"
            value={amountEth}
            onChange={(e) => setAmountEth(parseFloat(e.target.value))}
          />
        </div>
        <div className="flex gap-4">
          <Button
            className="flex-1"
            onClick={() => {
              writeAsyncYes();
            }}
          >
            Vote Yes
          </Button>
          <Button
            variant={"destructive"}
            className="flex-1"
            onClick={() => {
              writeAsyncNo();
            }}
          >
            Vote No
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BitcoinPriceBet;
