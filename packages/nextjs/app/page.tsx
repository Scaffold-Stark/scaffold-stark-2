"use client";

import type { NextPage } from "next";
import Image from "next/image";
import StepInstruction from "~~/components/StepInstruction/StepInstruction";
import ChallengeCard from "~~/components/ChallengeCard/ChallengeCard";
import {firstChallenges, lastChallenges} from "~~/data-challenges/challenges";
// bg-[#E7F0FE]
const Home: NextPage = () => {
  return (
      <div>
          <div className="w-full flex items-center justify-center flex-col bg-landing gap-20 bg-base-100 text-primary">
              <div className="w-full flex flex-col items-center gap-10 ">
                  <div className="w-full flex items-center justify-center flex-col gap-10">
                      <Image src={"/Starknet-icon.svg"} alt={"icon starknet"} width={50} height={50}/>
                      <span>Learn how to build on Starknet; the superpowers and the gotchas.</span>
                      <h1 className=" text-7xl font-black text-center max-w-[500px]">SPEEDRUN STARKNET</h1>
                  </div>
                  <div className="flex flex-col gap-5 bg-base-100 ">
                      <StepInstruction number={1} text="Watch this quick video as an Intro to Starknet Development."/>
                      <StepInstruction number={2}
                                       text="Then use Scaffold-Stark to copy/paste each Cairo concept and tinker: global units, primitives, mappings, structs, modifiers, events, inheritance, sending eth, and payable/fallback functions."/>
                      <StepInstruction number={3}
                                       text="Watch this getting started playlist to become a power user and eth scripter."/>
                      <StepInstruction number={4} text="When you are ready to test your knowledge, Speed Run Starknet"/>
                  </div>
              </div>
              <div className="footer-header-landing">
              </div>
          </div>
          <div className="w-full flex justify-center text-lg flex-col items-center text-primary">
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
              <div className=" bg-ft-join h-[600px] flex justify-center bg-secondary-content text-secondary">
                  <div className="max-w-[1280px] flex justify-around flex-col w-full border-l-[5px] border-base-300 ">
                      <div className="bg-banner-join flex justify-center h-[130px] w-full text-secondary font-black text-6xl ">
                          <span>JOIN BUILDGUILD</span>
                      </div>
                      <div className="flex">
                          <div className="max-w-[430px] w-full py-20 pl-20">
                              <span>The BuidlGuidl is a curated group of Ethereum builders creating products, prototypes, and tutorials to enrich the web3 ecosystem.
                                  A place to show off your builds and meet other builders. Start crafting your Web3 portfolio by submitting your DEX, Multisig or SVG NFT build.
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
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
  );
};

export default Home;
