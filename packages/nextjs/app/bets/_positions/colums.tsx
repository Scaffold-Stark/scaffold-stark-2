"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatUnits } from "ethers";
import { Badge } from "~~/app/Uikit/components/ui/badge";
import { Button } from "~~/app/Uikit/components/ui/button";
import ShineBorder from "~~/app/Uikit/components/ui/shine-border";
import { UserPostion } from "~~/types/user-position";

export const columns: ColumnDef<{ args: UserPostion }>[] = [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.args.market.name}</div>;
    },
  },
  {
    id: "status",
    header: () => <div className="text-right">Bet Status</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {row.original.args.market.is_active ? (
            <Badge variant={"outline"}>Active</Badge>
          ) : (
            <Badge>Not Active</Badge>
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
      return (
        <div className="text-right font-medium">
          {readableDate.toUTCString()}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Reward</div>,
    cell: ({ row }) => {
      //const payment = row.original;
      return (
        <div className="flex justify-end font-medium">
          <ShineBorder
            className="!min-h-0 !min-w-0 cursor-pointer !bg-transparent text-center font-bold capitalize"
            color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          >
            Claim
          </ShineBorder>
        </div>
      );
    },
  },
];
