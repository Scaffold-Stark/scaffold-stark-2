"use client";
import MyBets from "./MyBets";
import { useAccount } from "@starknet-react/core";
import MyCryptoBets from "./MyCryptoBets";
import {
  SkeletonHeader,
  SkeletonLong,
  SkeletonShort,
} from "../Uikit/components/ui/skeletons";
import { formatUnits } from "ethers";
import {
  createContractCall,
  useScaffoldMultiWriteContract,
} from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { shortString } from "starknet";
import { Card } from "../Uikit/components/ui/card";
import { isDatePassed } from "~~/utils/scaffold-stark/common";
import { Badge } from "../Uikit/components/ui/badge";
import { Button } from "../Uikit/components/ui/button";
import { useState } from "react";
import CustomModal from "../Uikit/components/ui/CustomModal";
import ConnectModal from "../Uikit/components/ui/CustomModal";
import CryptoPriceBet from "~~/components/Bets/CryptoPriceBet";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

function UserBetOverview({ bet }: { bet: any }) {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: betData, isLoading } = useScaffoldReadContract({
    contractName: "BetCryptoMaker",
    functionName: "getBet",
    args: [Number(bet.bet_id)],
  });
  const { writeAsync: claimRewards } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall("BetCryptoMaker", "claimRewards", [
        Number(bet.bet_id),
        bet.is_yes,
      ]),
    ],
  });

  return (
    <div className="w-full h-full">
      <Card className="shadow-md rounded-lg p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold mb-2">{bet.name}</h3>
          <p className="text-gray-500 mb-2">
            {shortString.decodeShortString(bet.category)}
          </p>
          <p className="text-gray-500 mb-2">
            Bet amount :{" "}
            {parseFloat(formatUnits(bet?.amount || "0")).toFixed(4)} ETH
          </p>
          <p
            className={`${bet.is_yes ? "text-primary" : "text-destructive"} font-bold mb-2`}
          >
            Your choice : {bet.is_yes ? "Yes" : "No"}
          </p>
        </div>
        {bet.is_bet_ended && !bet.has_claimed ? (
          <Button
            className="mt-4"
            onClick={() => {
              claimRewards();
            }}
          >
            Claim Rewards
          </Button>
        ) : bet.is_bet_ended && bet.has_claimed ? (
          <Badge variant={"secondary"} className="text-center h-10">
            Claimed!
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
        <ConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      ) : (
        <CustomModal
          title={bet.name}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        >
          <CryptoPriceBet cryptoPriceData={betData} isLoading={isLoading} />
        </CustomModal>
      )}
    </div>
  );
}

export default UserBetOverview;
