"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTcard";
import { useAccount } from "@starknet-react/core";
import { useScaffoldContract } from "~~/hooks/scaffold-stark/useScaffoldContract";
import { useScaffoldContractRead } from "~~/hooks/scaffold-stark/useScaffoldContractRead";
import { notification } from "~~/utils/scaffold-stark";
import { getMetadataFromIPFS } from "~~/utils/scaffold-stark/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/scaffold-stark/simpleNFT/nftsMetadata";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "Challenge0",
  });

  // console.log(connectedAddress)
  const { data: myTotalBalance } = useScaffoldContractRead({
    contractName: "Challenge0",
    functionName: "balance_of",
    args: [connectedAddress],
  });

  console.log(myTotalBalance);

  useEffect(() => {
    const updateMyCollectibles = async (): Promise<void> => {
      if (
        myTotalBalance === undefined ||
        yourCollectibleContract === undefined ||
        connectedAddress === undefined
      )
        return;

      setAllCollectiblesLoading(true);
      const collectibleUpdate: Collectible[] = [];
      const totalBalance = parseInt(myTotalBalance.toString());
      for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
        try {
          const tokenId =
            await yourCollectibleContract.read.tokenOfOwnerByIndex([
              connectedAddress,
              BigInt(tokenIndex),
            ]);

          const tokenURI = await yourCollectibleContract.read.tokenURI([
            tokenId,
          ]);

          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");

          const nftMetadata: NFTMetaData = await getMetadataFromIPFS(ipfsHash);

          collectibleUpdate.push({
            id: parseInt(tokenId.toString()),
            uri: tokenURI,
            owner: connectedAddress,
            ...nftMetadata,
          });
        } catch (e) {
          notification.error("Error fetching all collectibles");
          setAllCollectiblesLoading(false);
          console.log(e);
        }
      }
      collectibleUpdate.sort((a, b) => a.id - b.id);
      setMyAllCollectibles(collectibleUpdate);
      setAllCollectiblesLoading(false);
    };

    updateMyCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, myTotalBalance]);

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      {myAllCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No NFTs found</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {myAllCollectibles.map((item) => (
            <NFTCard nft={item} key={item.id} />
          ))}
        </div>
      )}
    </>
  );
};
