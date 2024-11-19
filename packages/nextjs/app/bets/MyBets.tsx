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

function MyBets() {
  const { address, status, chainId, ...props } = useAccount();
  const [modalOpen, setModalOpen] = useState(false);
  const { data: bitcoinPriceData, isLoading: isLoadingBitcoinPrice } =
    useScaffoldReadContract({
      contractName: "BitcoinPrice",
      functionName: "get_current_bet",
      args: undefined,
    });

  const { data: bitcoin_yes_balance, isLoading: isLoading_yes_bitcoin_amount } =
    useScaffoldReadContract({
      contractName: "BitcoinPrice",
      functionName: "get_own_yes_amount",
      args: [address as string, Number(bitcoinPriceData?.id)],
    });

  const { data: bitcoin_no_balance, isLoading: isLoading_no_bitcoin_amount } =
    useScaffoldReadContract({
      contractName: "BitcoinPrice",
      functionName: "get_own_no_amount",
      args: [address as string, Number(bitcoinPriceData?.id)],
    });

  const { writeAsync: claimBitcoinRewards } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall("BitcoinPrice", "claimRewards", [
        Number(bitcoinPriceData?.id),
      ]),
    ],
  });

  /* ETHER Price bets */
  const { data: etherPriceData, isLoading: isLoadingEtherPrice } =
    useScaffoldReadContract({
      contractName: "EtherPrice",
      functionName: "get_current_bet",
      args: undefined,
    });

  const { data: ether_yes_balance, isLoading: isLoading_yes_ether_amount } =
    useScaffoldReadContract({
      contractName: "EtherPrice",
      functionName: "get_own_yes_amount",
      args: [address as string, Number(etherPriceData?.id)],
    });

  const { data: ether_no_balance, isLoading: isLoading_no_ether_amount } =
    useScaffoldReadContract({
      contractName: "EtherPrice",
      functionName: "get_own_no_amount",
      args: [address as string, Number(etherPriceData?.id)],
    });

  const { writeAsync: claimEtherRewards } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall("EtherPrice", "claimRewards", [
        Number(etherPriceData?.id),
      ]),
    ],
  });

  /* Stark Price bets */
  const { data: starkPriceData, isLoading: isLoadingStarkPrice } =
    useScaffoldReadContract({
      contractName: "StarkPrice",
      functionName: "get_current_bet",
      args: undefined,
    });

  const { data: stark_yes_balance, isLoading: isLoading_yes_stark_amount } =
    useScaffoldReadContract({
      contractName: "StarkPrice",
      functionName: "get_own_yes_amount",
      args: [address as string, Number(starkPriceData?.id)],
    });

  const { data: stark_no_balance, isLoading: isLoading_no_stark_amount } =
    useScaffoldReadContract({
      contractName: "StarkPrice",
      functionName: "get_own_no_amount",
      args: [address as string, Number(starkPriceData?.id)],
    });

  const { writeAsync: claimStarkRewards } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall("StarkPrice", "claimRewards", [
        Number(starkPriceData?.id),
      ]),
    ],
  });
  const isLoading =
    isLoadingBitcoinPrice ||
    isLoading_yes_bitcoin_amount ||
    isLoading_no_bitcoin_amount ||
    isLoadingEtherPrice ||
    isLoading_yes_ether_amount ||
    isLoading_no_ether_amount ||
    isLoadingStarkPrice ||
    isLoading_yes_stark_amount ||
    isLoading_no_stark_amount;

  const bets = [
    {
      id: 1,
      name: `Bitcoin above  ${parseTokenPriceToNumber(
        bitcoinPriceData?.reference_token_price,
      )} before ${formatDate(bitcoinPriceData?.end_date)}?`,
      category: "Cryptos",
      amount: `${parseFloat(formatUnits(bitcoin_yes_balance || "0")).toFixed(4)}`,
      choice: true,
      betInfos: bitcoinPriceData,
      modalContent: (
        <BitcoinPriceBet
          bitcoinPriceData={bitcoinPriceData}
          isLoading={isLoadingBitcoinPrice}
        />
      ),
      display: bitcoin_yes_balance > 0,
      claimFunction: claimBitcoinRewards,
    },
    {
      id: 2,
      name: `Bitcoin above  ${parseTokenPriceToNumber(
        bitcoinPriceData?.reference_token_price,
      )} before ${formatDate(bitcoinPriceData?.end_date)}?`,
      category: "Cryptos",
      amount: `${parseFloat(formatUnits(bitcoin_no_balance || "0")).toFixed(4)}`,
      choice: false,
      betInfos: bitcoinPriceData,
      modalContent: (
        <BitcoinPriceBet
          bitcoinPriceData={bitcoinPriceData}
          isLoading={isLoadingBitcoinPrice}
        />
      ),
      display: bitcoin_no_balance > 0,
      claimFunction: claimBitcoinRewards,
    },
    {
      id: 3,
      name: `Ether above  ${parseTokenPriceToNumber(
        etherPriceData?.reference_token_price,
      )} before ${formatDate(etherPriceData?.end_date)}?`,
      category: "Cryptos",
      amount: `${parseFloat(formatUnits(ether_yes_balance || "0")).toFixed(4)}`,
      choice: true,
      betInfos: etherPriceData,
      modalContent: (
        <EtherPriceBet
          etherPriceData={etherPriceData}
          isLoading={isLoadingEtherPrice}
        />
      ),
      display: ether_yes_balance > 0,
      claimFunction: claimEtherRewards,
    },
    {
      id: 4,
      name: `Ether above  ${parseTokenPriceToNumber(
        etherPriceData?.reference_token_price,
      )} before ${formatDate(etherPriceData?.end_date)}?`,
      category: "Cryptos",
      amount: `${parseFloat(formatUnits(ether_no_balance || "0")).toFixed(4)}`,
      choice: false,
      betInfos: etherPriceData,
      modalContent: (
        <EtherPriceBet
          etherPriceData={etherPriceData}
          isLoading={isLoadingEtherPrice}
        />
      ),
      display: ether_no_balance > 0,
      claimFunction: claimStarkRewards,
    },
    {
      id: 5,
      name: `Stark above  ${parseStarkPriceToNumber(
        starkPriceData?.reference_token_price,
      ).toFixed(2)} before ${formatDate(starkPriceData?.end_date)}?`,
      category: "Cryptos",
      amount: `${parseFloat(formatUnits(stark_yes_balance || "0")).toFixed(4)}`,
      choice: true,
      betInfos: starkPriceData,
      modalContent: (
        <StarkPriceBet
          starkPriceData={starkPriceData}
          isLoading={isLoadingStarkPrice}
        />
      ),
      display: stark_yes_balance > 0,
      claimFunction: claimStarkRewards,
    },
    {
      id: 6,
      name: `Stark above  ${parseStarkPriceToNumber(
        starkPriceData?.reference_token_price,
      ).toFixed(2)} before ${formatDate(starkPriceData?.end_date)}?`,
      category: "Cryptos",
      amount: `${parseFloat(formatUnits(stark_no_balance || "0")).toFixed(4)}`,
      choice: false,
      betInfos: starkPriceData,
      modalContent: (
        <StarkPriceBet
          starkPriceData={starkPriceData}
          isLoading={isLoadingStarkPrice}
        />
      ),
      display: stark_no_balance > 0,
      claimFunction: claimStarkRewards,
    },
  ];
  const [selectedCategory, setSelectedCategory] = useState("all");
  const filteredBets =
    selectedCategory === "all"
      ? bets
      : bets.filter((bet) => bet.category === selectedCategory);

  if (isLoading) {
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
        {filteredBets.length === 0 && "No bets with this category."}
        {filteredBets
          .filter((bet) => bet.display === true)
          .map((bet) => {
            return (
              <div key={bet.id}>
                <Card className="flex flex-col justify-between rounded-lg p-4 shadow-md">
                  <div>
                    <h3 className="mb-2 text-lg font-bold">{bet.name}</h3>
                    <p className="mb-2 text-gray-500">{bet.category}</p>
                    <p className="mb-2 text-gray-500">
                      Bet amount : {bet.amount} ETH
                    </p>
                    <p
                      className={`${bet.choice ? "text-primary" : "text-destructive"} mb-2 font-bold`}
                    >
                      Your choice : {bet.choice ? "Yes" : "No"}
                    </p>
                  </div>
                  {isDatePassed(bet.betInfos?.end_date || 0n) &&
                  bet.betInfos?.is_token_price_end_set ? (
                    <Button
                      className="mt-4"
                      onClick={() => {
                        bet.claimFunction();
                      }}
                    >
                      Claim Rewards
                    </Button>
                  ) : isDatePassed(bet.betInfos?.end_date || 0n) &&
                    !bet.betInfos?.is_token_price_end_set ? (
                    <Badge variant={"secondary"} className="h-10 text-center">
                      Waiting for results to be set...
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setModalOpen(true)}
                    >
                      Reinforce position
                    </Button>
                  )}
                </Card>
                {status === "disconnected" ? (
                  <ConnectModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                  />
                ) : (
                  <CustomModal
                    title={bet.name}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                  >
                    {bet.modalContent}
                  </CustomModal>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default MyBets;
