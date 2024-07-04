const allChallenges = [
  {
    challenge: "Challenge #0",
    title: "🎟 Simple NFT Example",
    description:
      "🎫 Create a simple NFT to learn basics of 🏗 Scaffold-Stark. You'll use Scarb to compile and Starknet.js to deploy smart contracts. Then, you'll use a template React app full of important Starknet components and hooks. Finally, you'll deploy an NFT to a public network to share with friends! 🚀",
    imageUrl: "/simpleNFT.png",
    end: true,
    id: "simple-nft-example",
  },
  {
    challenge: "Challenge #1",
    title: "🥩 Decentralized Staking App",
    description:
      "🦸 A superpower of Starknet is allowing you, the builder, to create a simple set of rules that an adversarial group of players can use to work together. In this challenge, you create a decentralized application where users can coordinate a group funding effort. The users only have to trust the code.",
    imageUrl: "/stakingToken.png",
    id: "decentralized-staking",
  },
  {
    challenge: "Challenge #2",
    title: "🏵 Token Vendor",
    description:
      "🤖 Smart contracts are kind of like \"always on\" vending machines that anyone can access. Let's make a decentralized, digital currency (an ERC20 token in Cairo for Starknet). Then, let's build an unstoppable vending machine that will buy and sell the currency. We'll learn about the approve pattern for ERC20s and how contract to contract interactions work.",
    imageUrl: "/tokenVendor.png",
    border: true,
    id: "token-vendor",
  },
  {
    challenge: "Challenge #3",
    title: "🎲 Dice Game",
    description:
      "🎰 Randomness is tricky on a public deterministic blockchain. The block hash is the result proof-of-work (for now) and some builders use this as a weak form of randomness. In this challenge you will take advantage of a Dice Game contract by predicting the randomness in order to only roll winning dice!",
    imageUrl: "/diceGame.png",
    id: "dice-game",
  },
  {
    challenge: "Challenge #4",
    title: "⚖️ Build a DEX",
    description:
      "💵 Build an exchange that swaps ETH to STRK token and STRK token to ETH. 💰 This is possible because the smart contract holds reserves of both assets and has a price function based on the ratio of the reserves. Liquidity providers are issued a token that represents their share of the reserves and fees...",
    imageUrl: "/dex.png",
    id: "build-a-dex",
  },
  {
    challenge: "Challenge #5",
    title: "📺 A State Channel Application",
    description:
      "🛣️ The Ethereum blockchain has great decentralization & security properties but these properties come at a price: transaction throughput is low, and transactions can be expensive. This makes many traditional web applications infeasible on a blockchain... or does it? State channels look to solve these problems by allowing participants to securely transact off-chain while keeping interaction with Ethereum Mainnet at a minimum.",
    imageUrl: "/state.png",
    id: "state-channel-application",
  },
  {
    challenge: "Challenge #6",
    title: "👛 Multisig Wallet Challenge",
    description:
      "🛣️ The Ethereum blockchain has great decentralization & security properties but these properties come at a price: transaction throughput is low, and transactions can be expensive. This makes many traditional web applications infeasible on a blockchain... or does it? State channels look to solve these problems by allowing participants to securely transact off-chain while keeping interaction with Ethereum Mainnet at a minimum.",
    imageUrl: "/multiSig.png",
    id: "multisig-wallet-challenge",
  },
  {
    challenge: "Challenge #7",
    title: "🎁 SVG NFT 🎫 Building Cohort Challenge",
    description:
      "🧙 Tinker around with cutting edge smart contracts that render SVGs in Solidity. 🧫 We quickly discovered that the render function needs to be public... 🤔 This allows NFTs that own other NFTs to render their stash. Just wait until you see an Optimistic Loogie and a Fancy Loogie swimming around in the same Loogie Tank!",
    imageUrl: "/dynamicSvgNFT.png",
    border: false,
    id: "svg-nft",
  },
];

const firstChallenges = allChallenges.slice(0, 4);
const lastChallenges = allChallenges.slice(4);

export { firstChallenges, lastChallenges };
