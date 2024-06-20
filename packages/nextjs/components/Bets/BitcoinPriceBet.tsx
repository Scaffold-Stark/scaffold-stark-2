import { useAccount, useNetwork } from "@starknet-react/core";
import React from "react";
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

const SkeletonShort = () => {
  return (
    <div className="animate-pulse flex space-x-4">
      <div className="flex items-center space-y-6">
        <div className="h-3 w-28 bg-slate-300 rounded"></div>
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
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-6">
            <CardTitle>Your Balance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center text-4xl font-bold">
            <Balance address={address} />
          </CardContent>
        </Card>
        {isLoading ? (
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center justify-between">
                <span>Total Yes Bet</span>
                <span className="font-medium">
                  {parseFloat(
                    formatUnits(bitcoinPriceData?.total_amount_yes)
                  ).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total No Bet</span>
                <span className="font-medium">
                  {parseFloat(
                    formatUnits(bitcoinPriceData?.total_amount_no)
                  ).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Prize Pool</span>
                <span className="font-medium text-green-500">
                  {parseFloat(
                    formatUnits(bitcoinPriceData?.total_amount)
                  ).toFixed(4)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="mt-6 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="bet-amount">Enter Bet Amount</Label>
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
            className="flex-1 bg-blue-900"
            onClick={() => {
              writeAsyncYes();
            }}
          >
            Vote Yes
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-[#A2190F]"
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
