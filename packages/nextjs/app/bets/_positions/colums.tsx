"use client";

import { useAccount } from "@starknet-react/core";
import { ColumnDef } from "@tanstack/react-table";
import { formatUnits } from "ethers";
import { CairoCustomEnum, shortString } from "starknet";
import { BetType } from "~~/app/constants";
import { Badge } from "~~/app/Uikit/components/ui/badge";
import { Button } from "~~/app/Uikit/components/ui/button";
import ShineBorder from "~~/app/Uikit/components/ui/shine-border";
import { Skeleton } from "~~/app/Uikit/components/ui/skeleton";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { UserPostion } from "~~/types/user-position";
import { isTwoDaysAfterUTC } from "~~/utils/starksight";

export const columns: ColumnDef<{ args: UserPostion }>[] = [
  {
    accessorKey: "name",
    accessorFn: (row) => row.args.market.name,
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.args.market.name}</div>;
    },
  },
  {
    accessorKey: "status",
    accessorFn: (row) => row.args.market.is_active,
    header: () => <div className="text-right">Bet Status</div>,
    cell: ({ row }) => {
      const betType = shortString
        .decodeShortString(row.original.args.market.category)
        .toUpperCase();
      const betTypeEnum = new CairoCustomEnum({
        [BetType.CRYPTO]: betType === "CRYPTO" ? "get_crypto_bet" : undefined,
        [BetType.SPORTS]: betType === "SPORTS" ? "get_sport_bet" : undefined,
        [BetType.OTHER]: betType === "OTHER" ? "value" : undefined,
      });
      const { data: betInfos } = useScaffoldReadContract({
        contractName: "BetMaker",
        functionName: betTypeEnum.unwrap(),
        args: [Number(row.original.args.market.bet_id)],
      });

      return (
        <div className="text-right font-medium">
          {!betInfos ? (
            <Skeleton className="h-4 w-full" />
          ) : betInfos?.is_active ? (
            <Badge variant={"outline"}>Active</Badge>
          ) : (
            <Badge variant={"destructive"}>Not Active</Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {parseFloat(
            formatUnits(row.original.args.position.bought_amount),
          ).toFixed(4)}
        </div>
      );
    },
  },
  {
    id: "type",
    header: () => <div className="text-right">Position Type</div>,
    cell: ({ row }) => {
      const position_type =
        row.original.args.position.position_type.activeVariant();

      return (
        <div className="text-right font-medium">
          <Badge variant={position_type === "No" ? "destructive" : "default"}>
            {position_type}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "deadline",
    header: () => <div className="text-right">Deadline</div>,
    cell: ({ row }) => {
      const timestampInMilliseconds = row.original.args.market.deadline * 1000n;
      const readableDate = new Date(Number(timestampInMilliseconds));

      const utcYear = readableDate.getUTCFullYear();
      const utcMonth = readableDate.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      });
      const utcDay = String(readableDate.getUTCDate()).padStart(2, "0");

      const formattedDate = `${utcMonth} ${utcDay}, ${utcYear}`;
      return <div className="text-right font-medium">{formattedDate}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Reward</div>,
    cell: ({ row }) => {
      const { address } = useAccount();
      const betType = shortString
        .decodeShortString(row.original.args.market.category)
        .toUpperCase();
      const betTypeEnum = new CairoCustomEnum({
        [BetType.CRYPTO]: betType === "CRYPTO" ? "get_crypto_bet" : undefined,
        [BetType.SPORTS]: betType === "SPORTS" ? "get_sport_bet" : undefined,
        [BetType.OTHER]: betType === "OTHER" ? "value" : undefined,
      });
      const { data: betInfos } = useScaffoldReadContract({
        contractName: "BetMaker",
        functionName: betTypeEnum.unwrap(),
        args: [Number(row.original.args.market.bet_id)],
      });

      const { data: userPosition } = useScaffoldReadContract({
        contractName: "BetMaker",
        functionName: "get_user_position",
        args: [
          address,
          Number(row.original.args.market.bet_id),
          betTypeEnum,
          Number(row.original.args.position_id),
        ],
      });

      const { data: claimValue } = useScaffoldReadContract({
        contractName: "BetMaker",
        functionName: "get_position_rewards_amount",
        args: [
          address,
          Number(row.original.args.market.bet_id),
          betTypeEnum,
          Number(row.original.args.position_id),
        ],
      });

      const { sendAsync: claimRewards } = useScaffoldMultiWriteContract({
        calls: [
          {
            contractName: "BetMaker",
            functionName: "claim_rewards",
            args: [
              BigInt(row.original.args.market.bet_id),
              betTypeEnum,
              BigInt(row.original.args.position_id),
            ],
          },
        ],
      });

      if (!betInfos || !userPosition)
        return <Skeleton className="h-8 w-full" />;
      if (!betInfos.is_settled)
        return (
          <div className="flex justify-end font-medium">
            <Button variant={"outline"} disabled>
              bet still active
            </Button>
          </div>
        );
      if (userPosition.has_claimed)
        return (
          <div className="flex justify-end font-medium">
            <Button variant={"outline"} disabled>
              claimed
            </Button>
          </div>
        );
      const timestampInMilliseconds = row.original.args.market.deadline * 1000n;
      const readableDate = new Date(Number(timestampInMilliseconds));
      const isTwoDaysAfter = isTwoDaysAfterUTC(readableDate);

      if (betInfos.is_settled && !userPosition.has_claimed && !isTwoDaysAfter)
        return (
          <div className="flex justify-end font-medium">
            <Button variant={"outline"} disabled>
              wait for funds
            </Button>
          </div>
        );
      return (
        <div className="flex justify-end font-medium">
          <ShineBorder
            onClick={claimRewards}
            className="!min-h-0 !min-w-0 cursor-pointer !bg-transparent text-center font-bold capitalize"
            color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          >
            Claim{" "}
            {parseFloat(formatUnits(BigInt(claimValue || 0) || "0")).toFixed(4)}
          </ShineBorder>
        </div>
      );
    },
  },
];
