"use client";

import { useState, useMemo } from "react";
import { Button } from "../Uikit/components/ui/button";
import { FilterIcon } from "lucide-react";
import { useAccount } from "@starknet-react/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../Uikit/components/ui/dropdown-menu";
import { Card } from "../Uikit/components/ui/card";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import {
  formatDate,
  isDatePassed,
  parseStarkPriceToNumber,
  parseTokenPriceToNumber,
} from "~~/utils/scaffold-stark/common";
import {
  SkeletonHeader,
  SkeletonLong,
  SkeletonShort,
} from "../Uikit/components/ui/skeletons";
import { formatUnits } from "ethers";
import ConnectModal from "~~/components/scaffold-stark/CustomConnectButton/ConnectModal";
import CustomModal from "../Uikit/components/ui/CustomModal";
import BitcoinPriceBet from "~~/components/Bets/BitcoinPriceBet";
import { n } from "@starknet-react/core/dist/index-79NvzQC9";
import { Label } from "../Uikit/components/ui/label";
import { Badge } from "../Uikit/components/ui/badge";
import {
  createContractCall,
  useScaffoldMultiWriteContract,
} from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import EtherPriceBet from "~~/components/Bets/EtherPriceBet";
import StarkPriceBet from "~~/components/Bets/StarkPriceBet";
import { shortString } from "starknet";
import UserBetOverview from "./UserBetOverview";

function MyCryptoBets() {
  const { address, status, chainId, ...props } = useAccount();

  const { data: allUserPositions, isLoading } = useScaffoldReadContract({
    contractName: "BetCryptoMaker",
    functionName: "getAllUserPositions",
    args: [address],
  });

  const bets = allUserPositions;
  const [selectedCategory, setSelectedCategory] = useState("all");

  if (isLoading || !bets) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto shrink-0">
                <FilterIcon className="mr-2 h-4 w-4" />
                Filter by category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="end">
              <SkeletonLong />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid h-56 grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array(3)
            .fill(0)
            .map((_, index) => {
              return (
                <div key={index} className="h-full w-full">
                  <Card className="flex h-full flex-col justify-between rounded-lg p-4 shadow-md">
                    <div className="h-3/4">
                      <SkeletonHeader />
                    </div>
                    <SkeletonLong />
                  </Card>
                </div>
              );
            })}
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto shrink-0">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filter by category
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]" align="end">
            <DropdownMenuRadioGroup
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <DropdownMenuRadioItem value="all">
                All topics
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Cryptos">
                Cryptos
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Politics">
                Politics
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Sports">
                Sports
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Degens">
                Degens
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {bets.length === 0 && "No bets ongoing."}
        {bets.map((bet) => {
          return <UserBetOverview bet={bet} key={bet.id} />;
        })}
      </div>
    </div>
  );
}

export default MyCryptoBets;
