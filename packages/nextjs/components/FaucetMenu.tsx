"use client";
import { DropdownMenu, Button } from "@radix-ui/themes";
import { CaretDownIcon } from "@radix-ui/react-icons";

export default function FaucetMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="outline">
          Faucet <CaretDownIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>
          <a href="https://starknet-faucet.vercel.app/">Sepolia</a>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
