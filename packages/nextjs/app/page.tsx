"use client";

import type { NextPage } from "next";
import Image from "next/image";
import StepInstruction from "~~/components/StepInstruction/StepInstruction";
import ChallengeCard from "~~/components/ChallengeCard/ChallengeCard";
import { firstChallenges, lastChallenges } from "~~/data-challenges/challenges";
import { useRouter } from "next/navigation";
import localFont from "@next/font/local";
import SpeedStarknetIcon from "~~/components/icons/SpeedStarknetIcon";

const codec = localFont({ src: "../font/codec.ttf" });

const Home: NextPage = () => {
  const router = useRouter();
  return (
    <div>
      <div className="w-full flex items-center justify-center flex-col bg-landing gap-10 bg-base-100 text-primary sm:gap-3 ">
        <div className="w-full flex flex-col items-center gap-8 sm:gap-5">
          <div className="w-full flex items-center justify-center flex-col gap-10 sm:px-[20px] sm:gap-5 sm:text-[12px] max-w-[600px] ">
            <Image
              src={"/Starknet-icon.svg"}
              alt={"icon starknet"}
              width={50}
              height={50}
              className="sm:w-[30px] sm:h-[30px]"
            />
            <span className="text-center">
              Learn how to build on <strong>Starknet</strong>; the superpowers
              and the gotchas.
            </span>
            <h1
              className={`text-8xl font-black text-center sm:text-6xl ${codec.className}`}
            >
              SPEEDRUN STARKNET
            </h1>
          </div>
        </div>
        <div className="footer-header-landing"></div>
      </div>
      <div className="w-full flex justify-center text-lg flex-col items-center text-primary bg-">
        <div className="w-full px-[20px] flex justify-center flex-col items-center sm:pr-[35px]">
          {firstChallenges.slice(0, 4).map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge.challenge}
              title={challenge.title}
              description={challenge.description}
              imageUrl={challenge.imageUrl}
              buttonText="QUEST"
              onButtonClick={() => router.push(`/challenge/${challenge.id}`)}
              end={challenge.end || false}
              border={challenge.border !== undefined ? challenge.border : true}
            />
          ))}
        </div>

        <div className=" bg-ft-join flex justify-center bg-secondary-content text-secondary sm:h-[350px]">
          <div className="w-full px-[20px] flex justify-center">
            <div className="max-w-[1280px] flex justify-around flex-col w-full border-l-[5px] border-base-300 sm:justify-start sm:items-center sm:border-l-[3px] lg:border-l-[3px] pt-[20px]">
              <div className="bg-banner-join flex justify-center h-[130px] w-full text-secondary font-black text-7xl items-center sm:text-3xl sm:h-[80px]">
                <span className="font-black font-['system-ui']">
                  JOiN CORE-STARS
                </span>
              </div>
              <div className="flex lg:justify-center">
                <div className="max-w-[430px] w-full py-20 pl-20 sm:py-0 sm:pl-3 sm:flex lg:pl-0  lg:pt-0">
                  <span className="sm:text-[12px] sm:text-center leading-7 sm:text-xs">
                    The Core-Stars is a curated group of Starknet builders
                    creating products, prototypes, and tutorials to enrich the
                    web3 ecosystem. A place to show off your builds and meet
                    other builders. Start crafting your Web3 portfolio by
                    submitting your DEX, onchain Game or SVG NFT build.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full px-[20px] flex justify-center flex-col items-center">
          {lastChallenges.slice(0).map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge.challenge}
              title={challenge.title}
              description={challenge.description}
              imageUrl={challenge.imageUrl}
              buttonText="COMING SOON"
              onButtonClick={() => router.push(`/challenge/${challenge.id}`)}
              end={challenge.end || false}
              border={challenge.border !== undefined ? challenge.border : true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
