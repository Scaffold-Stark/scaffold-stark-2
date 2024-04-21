"use client";

import type { NextPage } from "next";
import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { MyHoldings } from "~~/components/SimpleNFT/MyHoldings";
import { useScaffoldContractRead } from "~~/hooks/scaffold-stark/useScaffoldContractRead";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-stark/useScaffoldContractWrite";
import { notification } from "~~/utils/scaffold-stark";
import { addToIPFS } from "~~/utils/scaffold-stark/simpleNFT/ipfs-fetch";
import { useScaffoldContract } from "~~/hooks/scaffold-stark/useScaffoldContract";
import nftsMetadata from "~~/utils/scaffold-stark/simpleNFT/nftsMetadata";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  console.log(connectedAddress);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "Challenge0",
  });

  const { writeAsync: mintItem, error: error } = useScaffoldContractWrite({
    contractName: "Challenge0",
    functionName: "mint_item",
    args: [
      connectedAddress ?? "",
      `[${new TextEncoder().encode("Your string here").toString()}]`,
    ],
  });

  // console.log(mintItem)
  // console.log(error)

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "Challenge0",
    functionName: "token_id_counter",
    watch: true,
    cacheOnBlock: true,
  });

  const handleMintItem = async () => {
    // circle back to the zero item if we've reached the end of the array
    if (tokenIdCounter === undefined) return;

    const tokenIdCounterNumber = Number(tokenIdCounter);
    const currentTokenMetaData =
      nftsMetadata[tokenIdCounterNumber % nftsMetadata.length];
    const notificationId = notification.loading("Uploading to IPFS");
    try {
      const uploadedItem = await addToIPFS(currentTokenMetaData);

      // First remove previous loading notification and then show success notification
      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");

      await mintItem({
        args: [connectedAddress, uploadedItem.path],
      });
    } catch (error) {
      notification.remove(notificationId);
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">My NFTs</span>
          </h1>
        </div>
      </div>
      <div className="flex justify-center">
        {!isConnected || isConnecting ? (
          <CustomConnectButton />
        ) : (
          <button className="btn btn-secondary" onClick={handleMintItem}>
            Mint NFT
          </button>
        )}
      </div>
      <MyHoldings />
    </>
  );
};

export default MyNFTs;
