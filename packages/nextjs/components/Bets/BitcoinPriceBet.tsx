import { Button } from "~~/Uikit/components/ui/button";
import { Input } from "~~/Uikit/components/ui/input";
import { Label } from "~~/Uikit/components/ui/label";
import { useAccount, useNetwork } from "@starknet-react/core";
import React from "react";
import {
  CardHeader,
  CardTitle,
  CardContent,
  Card,
} from "~~/Uikit/components/ui/card";
import { Balance } from "../scaffold-stark";

function BitcoinPriceBet() {
  const { address, status, chainId, ...props } = useAccount();
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
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center justify-between">
              <span>Average Bet</span>
              <span className="font-medium">$25.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Highest Bet</span>
              <span className="font-medium">$100.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Profit/Loss</span>
              <span className="font-medium text-green-500">+$150.00</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="bet-amount">Enter Bet Amount</Label>
          <Input id="bet-amount" type="number" placeholder="$0.00" />
        </div>
        <div className="flex gap-4">
          <Button className="flex-1 bg-blue-900">Vote Yes</Button>
          <Button variant="outline" className="flex-1 bg-[#A2190F]">
            Vote No
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BitcoinPriceBet;
