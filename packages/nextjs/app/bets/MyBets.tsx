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
  parseBitcoinPriceToNumber,
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
      args: [Number(bitcoinPriceData?.id)],
    });

  const isLoading = isLoadingBitcoinPrice || isLoading_yes_bitcoin_amount;
  const bets = [
    {
      id: 1,
      name: `Bitcoin above  ${parseBitcoinPriceToNumber(
        bitcoinPriceData?.reference_token_price
      )} before ${formatDate(bitcoinPriceData?.end_date)}?`,
      category: "Cryptos",
      amount: `${parseFloat(formatUnits(bitcoin_yes_balance || "0")).toFixed(4)}`,
      choice: true,
      modalContent: (
        <BitcoinPriceBet
          bitcoinPriceData={bitcoinPriceData}
          isLoading={isLoadingBitcoinPrice}
        />
      ),
    },
    /* {
      id: 2,
      name: "Plus de 3 buts marqués",
      category: "Football",
      amount: 20,
      choice: false,
    },
    {
      id: 3,
      name: "Podium pour le pilote X",
      category: "Formule 1",
      amount: 30,
      choice: true,
    },
    {
      id: 4,
      name: "Victoire de l'équipe B",
      category: "Football",
      amount: 40,
      choice: false,
    },
    {
      id: 5,
      name: "Plus de 100 points marqués",
      category: "Basket",
      amount: 25,
      choice: true,
    }, */
  ];
  const [selectedCategory, setSelectedCategory] = useState("all");
  const filteredBets = useMemo(() => {
    if (selectedCategory === "all") {
      return bets;
    } else {
      return bets.filter((bet) => bet.category === selectedCategory);
    }
  }, [selectedCategory, bitcoinPriceData]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto shrink-0">
                <FilterIcon className="w-4 h-4 mr-2" />
                Filter by category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="end">
              <SkeletonLong />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 h-56">
          {Array(3)
            .fill(0)
            .map((_, index) => {
              return (
                <div key={index} className="w-full h-full">
                  <Card className="shadow-md rounded-lg p-4 flex flex-col justify-between h-full">
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
              <FilterIcon className="w-4 h-4 mr-2" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredBets.map((bet) => {
          return (
            <div key={bet.id}>
              <Card className="shadow-md rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">{bet.name}</h3>
                  <p className="text-gray-500 mb-2">{bet.category}</p>
                  <p className="text-gray-500 mb-2">
                    Bet amount : {bet.amount} ETH
                  </p>
                  <p
                    className={`${bet.choice ? "text-green-500" : "text-red-500"} font-bold mb-2`}
                  >
                    Your choice : {bet.choice ? "Yes" : "No"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setModalOpen(true)}
                >
                  Reinforce position
                </Button>
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
