"use client";
import { useAccount } from "~~/hooks/useAccount";
import { Address } from "./scaffold-stark";
import { Address as AddressType } from "@starknet-react/chains";
import { useScaffoldStarkProfile } from "~~/hooks/scaffold-stark/useScaffoldStarkProfile";

export const ConnectedAddress = () => {
  const connectedAddress = useAccount();

  const { data: fetchedProfile, isLoading } = useScaffoldStarkProfile(connectedAddress.address as AddressType);

  return (
    <div className="flex justify-center items-center space-x-2">
      <p className="my-2 font-medium text-[#00A3FF]">Connected Address:</p>
      <Address address={connectedAddress.address as AddressType} profile={fetchedProfile} isLoading={isLoading} />
    </div>
  );
};
