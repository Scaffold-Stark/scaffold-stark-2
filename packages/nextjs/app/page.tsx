"use client";

import type { NextPage } from "next";
import Image from "next/image";
import StepInstruction from "~~/components/StepInstruction/StepInstruction";
import ChallengeCard from "~~/components/ChallengeCard/ChallengeCard";

const Home: NextPage = () => {
  return (
      <div>
          <div className="w-full flex items-center justify-center flex-col bg-[#E7F0FE] bg-landing gap-20 ">
              <div className="w-full flex flex-col items-center gap-10 ">
                  <div className="w-full flex items-center justify-center flex-col gap-10">
                      <Image src={"/Starknet-icon.svg"} alt={"icon starknet"} width={50} height={50}/>
                      <span>Learn how to build on Starknet; the superpowers and the gotchas.</span>
                      <h1 className=" text-7xl font-black text-center max-w-[500px]">SPEEDRUN STARKNET</h1>
                  </div>

                  <div className="flex flex-col gap-5 ">
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
          <div className="w-full flex justify-center text-lg flex-col items-center">

              <ChallengeCard challenge="Challenge #0"  title="🎟 Simple NFT Example" description="🎫 Create a simple NFT to learn basics of scaffold-Stark. You'll use 👷‍♀️ HardHat to compile and deploy smart contracts.
                  Then, you'll use a template React app full of important Ethereum components and hooks.
                  Finally, you'll deploy an NFT to a public network to share with friends! 🚀" imageUrl="/simpleNFT.png" buttonText="QUEST" onButtonClick={()=>{}} end={true}/>
              <ChallengeCard challenge="Challenge #1" title="🥩 Decentralized Staking App" description="🦸 A superpower of Ethereum is allowing you, the builder, to create a simple set of rules that an adversarial group of players can use to work together.
               In this challenge, you create a decentralized application where users can coordinate a group funding effort. The users only have to trust the code." imageUrl="/stakingToken.png" buttonText="QUEST" onButtonClick={()=>{}}/>
              <ChallengeCard challenge="Challenge #2" title="🏵 Token Vendor" description="🤖 Smart contracts are kind of like always on vending machines that anyone can access. Let's make a decentralized, digital currency (an ERC20 token).
              Then, let's build an unstoppable vending machine that will buy and sell the currency. We'll learn about the approve pattern for ERC20s and how contract to contract interactions work."
                             imageUrl="/tokenVendor.png" buttonText="QUEST" onButtonClick={()=>{}} border={false}/>

              <div className="bg-[#E7F0FE] bg-ft-join h-[600px] flex justify-center ">
                  <div className="max-w-[1280px] flex justify-around flex-col w-full border-l-[5px] border-[#191972] ">
                      <div className="bg-banner-join flex justify-center h-[130px] w-full text-[#0C0C4F] font-black text-6xl ">
                          <span>JOIN BUILDGUILD</span>
                      </div>
                      <div className="flex ">
                          <div className="max-w-[430px] w-full py-20 pl-20">
                              <span>The BuidlGuidl is a curated group of Ethereum builders creating products, prototypes, and tutorials to enrich the web3 ecosystem. A place to show off your builds and meet other builders. Start crafting your Web3 portfolio by submitting your DEX, Multisig or SVG NFT build.</span>
                          </div>
                      </div>
                  </div>


              </div>
              <ChallengeCard challenge="Challenge #3" title="🎲 Dice Game" description="🎰 Randomness is tricky on a public deterministic blockchain. The block hash is the result proof-of-work (for now) and some builders use this as a weak form of randomness.
              In this challenge you will take advantage of a Dice Game contract by predicting the randomness in order to only roll winning dice!"
                             imageUrl="/diceGame.png" buttonText="QUEST" onButtonClick={() => {
              }}/>
              <ChallengeCard challenge="Challenge #4" title="⚖️ Build a DEX" description="💵 Build an exchange that swaps ETH to tokens and tokens to ETH. 💰 This is possible because the smart contract holds reserves of both assets and has a price function based on the ratio of the reserves. Liquidity providers are issued a token that represents their share of the reserves and fees..."
                             imageUrl="/dex.png" buttonText="LOCK" onButtonClick={()=>{}}/>
              <ChallengeCard challenge="Challenge #5" title="📺 A State Channel Application" description="🛣️ The Ethereum blockchain has great decentralization & security properties but these properties come at a price: transaction throughput is low, and transactions can be expensive.
              This makes many traditional web applications infeasible on a blockchain... or does it? State channels look to solve these problems by allowing participants to securely transact off-chain while keeping interaction with Ethereum Mainnet at a minimum." imageUrl="/state.png" buttonText="QUEST" onButtonClick={()=>{}}/>
              <ChallengeCard challenge="Challenge #6" title="👛 Multisig Wallet Challenge" description="🛣️ The Ethereum blockchain has great decentralization & security properties but these properties come at a price: transaction throughput is low, and transactions can be expensive. This makes many traditional web applications infeasible on a blockchain... or does it? State channels look to solve these problems by allowing participants to securely transact off-chain while keeping interaction with Ethereum Mainnet at a minimum."
                             imageUrl="/multiSig.png" buttonText="LOCK" onButtonClick={()=>{}}/>
              <ChallengeCard challenge="Challenge #7" title="🎁 SVG NFT 🎫 Building Cohort Challenge" description="🧙 Tinker around with cutting edge smart contracts that render SVGs in Solidity.
               🧫 We quickly discovered that the render function needs to be public... 🤔 This allows NFTs that own other NFTs to render their stash.
               Just wait until you see an Optimistic Loogie and a Fancy Loogie swimming around in the same Loogie Tank!" imageUrl="/dynamicSvgNFT.png" buttonText="LOCK" onButtonClick={()=>{}} border={false}/>



          </div>

      </div>


  );
};

export default Home;
