"use client";

import type { NextPage } from "next";
import Image from "next/image";
import StepInstruction from "~~/components/StepInstruction/StepInstruction";
import ChallengeCard from "~~/components/ChallengeCard/ChallengeCard";
import { firstChallenges, lastChallenges } from "~~/data-challenges/challenges";
const Home: NextPage = () => {
  return (
    <div>
      <div className="w-full flex items-center justify-center flex-col bg-landing gap-10 bg-base-100 text-primary sm:gap-3 ">
        <div className="w-full flex flex-col items-center gap-10 sm:gap-5">
          <div className="w-full flex items-center justify-center flex-col gap-10 sm:px-[20px] sm:gap-5 sm:text-[12px] max-w-[600px] ">
            <Image
              src={"/Starknet-icon.svg"}
              alt={"icon starknet"}
              width={50}
              height={50}
              className="sm:w-[30px] sm:h-[30px]"
            />
            <span className="text-center">
              Learn how to build on Starknet; the superpowers and the gotchas.
            </span>
            <h1 className="text-8xl font-black text-center sm:text-6xl font-['system-ui']">
              SPEEDRUN STARKNET
            </h1>
          </div>
          <div className="flex flex-col gap-5 bg-base-100 sm:px-[20px] ">
            <StepInstruction
              number={1}
              text="Watch this quick video as an Intro to Starknet Development."
            />
            <StepInstruction
              number={2}
              text="Then use Scaffold-Stark to copy/paste each Cairo concept and tinker: global units, primitives, mappings, structs, modifiers, events, inheritance, sending eth, and payable/fallback functions."
            />
            <StepInstruction
              number={3}
              text="Watch this getting started playlist to become a power user and eth scripter."
            />
            <StepInstruction
              number={4}
              text="When you are ready to test your knowledge, Speed Run Starknet"
            />
          </div>
        </div>
        <div className="footer-header-landing"></div>
      </div>
      <div className="w-full flex justify-center text-lg flex-col items-center text-primary ">
        <div className="w-full px-[20px] flex justify-center flex-col items-center sm:pr-[35px]">
          {firstChallenges.slice(0, 3).map((challenge, index) => (
            <ChallengeCard
              key={index}
              challenge={challenge.challenge}
              title={challenge.title}
              description={challenge.description}
              imageUrl={challenge.imageUrl}
              buttonText="QUEST"
              onButtonClick={() => {}}
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
                  JOiN BUiLDGUiLD
                </span>
              </div>
              <div className="flex lg:justify-center">
                <div className="max-w-[430px] w-full py-20 pl-20 sm:py-0 sm:pl-3 sm:flex lg:pl-0  lg:pt-0">
                  <span className="sm:text-[12px] sm:text-center ">
                    The BuidlGuidl is a curated group of Ethereum builders
                    creating products, prototypes, and tutorials to enrich the
                    web3 ecosystem. A place to show off your builds and meet
                    other builders. Start crafting your Web3 portfolio by
                    submitting your DEX, Multisig or SVG NFT build.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full px-[20px] flex justify-center flex-col items-center">
          {lastChallenges.slice(1).map((challenge, index) => (
            <ChallengeCard
              key={index}
              challenge={challenge.challenge}
              title={challenge.title}
              description={challenge.description}
              imageUrl={challenge.imageUrl}
              buttonText="LOCK"
              onButtonClick={() => {}}
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
