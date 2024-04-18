"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTcard";
import { notification } from "~~/utils/scaffold-stark";
import nftsMetadata, { NFTMetaData } from "~~/utils/scaffold-stark/simpleNFT/nftsMetadata";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
}

export const MyHoldings = () => {


  return (
    <>
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
         {nftsMetadata.map((item,index)=>(

            <NFTCard nft={item} key={index} />
         ))}
         
        </div>
    </>
  );
};
