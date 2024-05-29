# 🚩 Challenge #0: 🎟 Simple NFT Example

![readme-0](../speedrunstark/packages/nextjs/public/hero-bgtransparent.png)

🎫 Create a simple NFT to learn basics of 🏗 Scaffold-ETH 2. You'll use [👷‍♀️ HardHat](https://hardhat.org/getting-started/) to compile and deploy smart contracts. Then, you'll use a template React app full of important Ethereum components and hooks. Finally, you'll deploy an NFT to a public network to share with friends! 🚀

🌟 The final deliverable is an app that lets users purchase and transfer NFTs. Deploy your contracts to a testnet, then build and upload your app to a public web server. Submit the url on [SpeedRunEthereum.com](https://speedrunethereum.com)!

💬 Meet other builders working on this challenge and get help in the [Challenge 0 Telegram](https://t.me/+Y2vqXZZ_pEFhMGMx)!

## Checkpoint 0: 📦 Environment 📚
# 🏗 Scaffold-Stark 2

<h4 align="center">
  <a href="https://www.docs.scaffoldstark.com/">Documentation</a> |
  <a href="https://www.scaffoldstark.com/">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on Starknet blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, Starknet.js, Scarb, Starknet-React, Starknet Foundry and Typescript.

- ✅ **Contract Fast Reload**: Your frontend auto-adapts to your smart contracts as you deploy them.
- 🪝 **[Custom hooks]()**: Collection of React hooks wrapper around [starknet-react](https://starknet-react.com/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Prefunded Account**: Quickly test your application with a burner wallet and prefunded accounts.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with Starknet network.

![Debug Contracts tab](./assests/debug-contracts.png)

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

Then download the challenge to your computer and install dependencies by running:

```sh
git clone https://github.com/scaffold-eth/se-2-challenges.git challenge-0-simple-nft
cd challenge-0-simple-nft
git checkout challenge-0-simple-nft
scarb --version
```

If your local Scarb version is not `2.5.4`, you need to install it.

<details>
<summary><b>Scarb Installation Process</b></summary>

To install Scarb, please refer to the [installation instructions](https://docs.swmansion.com/scarb/download).
We strongly recommend that you install
Scarb via [asdf](https://docs.swmansion.com/scarb/download.html#install-via-asdf), a CLI tool that can manage
multiple language runtime versions on a per-project basis.
This will ensure that the version of Scarb you use to work on a project always matches the one defined in the
project settings, avoiding problems related to version mismatches.

Please refer to the [asdf documentation](https://asdf-vm.com/guide/getting-started.html) to install all
prerequisites.

Once you have `asdf` installed locally, you can download Scarb plugin with the following command:

```bash
asdf plugin add scarb
```

This will allow you to download specific versions. You can choose the same version as the Dojo's Cairo version, for example, 2.5.4, with the following command:

```bash
asdf install scarb 2.5.4
```

and set a global version:

```bash
asdf global scarb 2.5.4
```

Otherwise, you can simply run the following command in your terminal, and follow the onscreen instructions. This
will install the version `2.5.4` of Scarb.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh -s -- -v 2.5.4
```

</details>

### Starknet Foundry version

To ensure the proper functioning of the tests on scaffold-stark, your Starknet Foundry version must be 0.23.0. To accomplish this, first check your Starknet Foundry version:

```sh
snforge --version
```

If your Starknet Foundry version is not `0.23.0`, you need to install it.

- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/getting-started/installation.html)

## Compatible versions

- scarb - v2.5.4
- cairo - v2.5.4
- starknet - v2.5.4
- snforge - v0.23.0 // starknet foundry
- sierra - v1.4.0
- rpc - v0.5.1

## Quickstart

To get started with Scaffold-Stark 2, follow the steps below:

1. Clone this repo and install dependencies

```bash
git clone https://github.com/Quantum3-Labs/scaffold-stark-2 --recurse-submodules
cd scaffold-stark-2
yarn install
```

> in the same terminal, start your local network (a blockchain emulator in your computer):

```sh
2. Prepare your environment variables.

Since we are using localhost(devnet), **you can skip this step!**. But if you want use the .env file anyway, you can fill the envs related to devnet with any predeployed contract address and private key from starknet-devnet.

**Note:** In case you want to deploy on Sepolia, you need to fill the envs related to sepolia testnet with your own contract address and private key.

```bash
cp packages/snfoundry/.env.example packages/snfoundry/.env
```

3. Run a local network in the first terminal.

**Note:** You can skip this step if you want to use Sepolia Testnet.

```bash
yarn chain
```

> in a second terminal window, 🛰 deploy your contract (locally):

```sh
cd challenge-0-simple-nft
yarn deploy
```

> in a third terminal window, start your 📱 frontend:

```sh
cd challenge-0-simple-nft
This command starts a local Starknet network using Devnet. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `scaffold.config.ts`.

4. On a second terminal, deploy the sample contract:

```
yarn deploy --network {NETWORK_NAME} // when NETWORK_NAME is not specified, it defaults to "devnet"
```

**Note:** To use sepolia tesnet, you have to set {NETWORK_NAME} to `sepolia`.

This command deploys a sample smart contract to the local network. The contract is located in `packages/snfoundry/contracts/src` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/snfoundry/scripts-ts/deploy.ts` to deploy the contract to the network. You can also customize the deploy script.

5. On a third terminal, start your NextJS app:

```
yarn start
```

📱 Open http://localhost:3000 to see the app.

---

## Checkpoint 1: ⛽️ Gas & Wallets 👛

> ⛽️ You'll need to get some funds from the faucet for gas.

![gas&wallet](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/912d0d4b-db34-49d3-bd7d-7ca0ab18eb66)

> 🦊 At first, **don't** connect MetaMask. If you are already connected, click **Disconnect**:

<p>
  <img src="https://github.com/scaffold-eth/se-2-challenges/assets/80153681/2c7a1e40-50ad-4c20-ba3e-a56eff4b892b" width="33%" />
  <img src="https://github.com/scaffold-eth/se-2-challenges/assets/80153681/1bcf9752-e8ae-4db6-a0a6-5dc774abe46c" width="33%" />
</p>

> 🔥 We'll use burner wallets on localhost.

> 👛 Explore how burner wallets work in 🏗 Scaffold-ETH 2 by opening a new incognito window and navigate to http://localhost:3000. You'll notice it has a new wallet address in the top right. Copy the incognito browser's address and send localhost test funds to it from your first browser (using the **Faucet** button in the bottom left):

![icognito&webBrowser](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/fd191447-a31f-4c03-a36f-936bfb70c2a1)

> 👨🏻‍🚒 When you close the incognito window, the account is gone forever. Burner wallets are great for local development but you'll move to more permanent wallets when you interact with public networks.

---

## Checkpoint 2: 🖨 Minting

> ✏️ Mint some NFTs! Click the **MINT NFT** button in the `My NFTs` tab.

![image](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/74cf02f2-4c1b-4278-9841-f19f668e0b1e)

👀 You should see your NFTs start to show up:

![image](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/63dabceb-ad42-4c09-8e5d-a0139939e32d)

👛 Open an incognito window and navigate to http://localhost:3000

🎟 Transfer an NFT to the incognito window address using the UI:

![image](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/3b92fb50-d43f-48a8-838c-c45c443b0b71)

👛 Try to mint an NFT from the incognito window.

> Can you mint an NFT with no funds in this address? You might need to grab funds from the faucet to pay for the gas!

🕵🏻‍♂️ Inspect the `Debug Contracts` tab to figure out what address is the owner of YourCollectible?

🔏 You can also check out your smart contract `YourCollectible.sol` in `packages/hardhat/contracts`.

💼 Take a quick look at your deploy script `00_deploy_your_contract.js` in `packages/hardhat/deploy`.

📝 If you want to edit the frontend, navigate to `packages/nextjs/app` and open the specific page you want to modify. For instance: `/myNFTs/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.

---

## Checkpoint 3: 💾 Deploy your contract! 🛰

🛰 Ready to deploy to a public testnet?!?

> Change the defaultNetwork in `packages/hardhat/hardhat.config.ts` to `sepolia`.

![chall-0-hardhat-config](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/f94b47d8-aa51-46eb-9c9e-7536559a5d45)

🔐 Generate a deployer address with `yarn generate`. This creates a unique deployer address and saves the mnemonic locally.

> This local account will deploy your contracts, allowing you to avoid entering a personal private key.

![chall-0-yarn-generate](https://github.com/scaffold-eth/se-2-challenges/assets/2486142/133f5701-e575-4cc2-904f-cdc83ae86d94)

👩‍🚀 Use `yarn account` to view your deployer account balances.

![chall-0-yarn-account](https://github.com/scaffold-eth/se-2-challenges/assets/2486142/c34df8c9-9793-4a76-849b-170fae7fd0f0)

⛽️ You will need to send ETH to your deployer address with your wallet, or get it from a public faucet of your chosen network.

> Some popular faucets are [https://sepoliafaucet.com/](https://sepoliafaucet.com/) and [https://www.infura.io/faucet/sepolia](https://www.infura.io/faucet/sepolia)

> ⚔️ Side Quest: Keep a 🧑‍🎤 [punkwallet.io](https://punkwallet.io) on your phone's home screen and keep it loaded with testnet eth. 🧙‍♂️ You'll look like a wizard when you can fund your deployer address from your phone in seconds.

🚀 Deploy your NFT smart contract with `yarn deploy`.

> 💬 Hint: You can set the `defaultNetwork` in `hardhat.config.ts` to `sepolia` **OR** you can `yarn deploy --network sepolia`.

---

## Checkpoint 4: 🚢 Ship your frontend! 🚁

> ✏️ Edit your frontend config in `packages/nextjs/scaffold.config.ts` to change the `targetNetwork` to `chains.sepolia` :

![chall-0-scaffold-config](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/3b50c7a7-b9cc-4af3-ab2a-11be4f5d2235)

> You should see the correct network in the frontend (http://localhost:3000):

![image](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/50eef1f7-e1a3-4b3b-87e2-59c19362c4ff)

> 🦊 Since we have deployed to a public testnet, you will now need to connect using a wallet you own or use a burner wallet. By default 🔥 `burner wallets` are only available on `hardhat` . You can enable them on every chain by setting `onlyLocalBurnerWallet: false` in your frontend config (`scaffold.config.ts` in `packages/nextjs/`)

![image](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/f582d311-9b57-4503-8143-bac60346ea33)

> 💬 Hint: For faster loading of your transfer page, consider updating the `fromBlock` passed to `useScaffoldEventHistory` in [`packages/nextjs/app/transfers/page.tsx`](https://github.com/scaffold-eth/se-2-challenges/blob/challenge-0-simple-nft/packages/nextjs/app/transfers/page.tsx#L12) to `blocknumber - 10` at which your contract was deployed. Example: `fromBlock: 3750241n` (where `n` represents its a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)). To find this blocknumber, search your contract's address on Etherscan and find the `Contract Creation` transaction line.

🚀 Deploy your NextJS App

```shell
yarn vercel
```

> Follow the steps to deploy to Vercel. Once you log in (email, github, etc), the default options should work. It'll give you a public URL.

> If you want to redeploy to the same production URL you can run `yarn vercel --prod`. If you omit the `--prod` flag it will deploy it to a preview/test URL.

⚠️ Run the automated testing function to make sure your app passes

```shell
yarn test
```

#### Configuration of Third-Party Services for Production-Grade Apps.

By default, 🏗 Scaffold-ETH 2 provides predefined API keys for popular services such as Alchemy and Etherscan. This allows you to begin developing and testing your applications more easily, avoiding the need to register for these services.  
This is great to complete your **SpeedRunEthereum**.

For production-grade applications, it's recommended to obtain your own API keys (to prevent rate limiting issues). You can configure these at:

- 🔷`ALCHEMY_API_KEY` variable in `packages/hardhat/.env` and `packages/nextjs/.env.local`. You can create API keys from the [Alchemy dashboard](https://dashboard.alchemy.com/).

- 📃`ETHERSCAN_API_KEY` variable in `packages/hardhat/.env` with your generated API key. You can get your key [here](https://etherscan.io/myapikey).

> 💬 Hint: It's recommended to store env's for nextjs in Vercel/system env config for live apps and use .env.local for local testing.

---

## Checkpoint 5: 📜 Contract Verification

You can verify your smart contract on Etherscan by running (`yarn verify --network network_name`) :

```shell
yarn verify --network sepolia
```

> It is okay if it says your contract is already verified. Copy the address of YourCollectable.sol and search it on sepolia Etherscan to find the correct URL you need to submit this challenge.

## Checkpoint 6: 💪 Flex!

👩‍❤️‍👨 Share your public url with a friend and ask them for their address to send them a collectible :)

![gif](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/547612f6-97b9-4eb3-ab6d-9b6d2c0ac769)

## ⚔️ Side Quests

### 🐟 Open Sea

> 🐃 Want to see your new NFTs on Opensea? Head to [Testnets Opensea](https://testnets.opensea.io/)

> 🎫 Make sure you have minted some NFTs on your Vercel page, then connect to Opensea using that same wallet.

![image](https://github.com/scaffold-eth/se-2-challenges/assets/80153681/c752b365-b801-4a02-ba2e-62e0270b3795)

> You can see your collection of shiny new NFTs on a testnet!

(It can take a while before they show up, but here is an example:) https://testnets.opensea.io/assets/sepolia/0x17ed03686653917efa2194a5252c5f0a4f3dc49c/2

---

> 🏃 Head to your next challenge [here](https://github.com/scaffold-eth/se-2-challenges).

> 💬 Problems, questions, comments on the stack? Post them to the [🏗 scaffold-eth developers chat](https://t.me/joinchat/F7nCRK3kI93PoCOk)
Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

**What's next**:

- Edit your smart contract `YourContract.cairo` in `packages/snfoundry/contracts/src`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/snfoundry/script-ts/deploy.ts`
- Edit your smart contract tests in `packages/snfoundry/contracts/src/test`. To run tests use `yarn test`

## Documentation (Coming Soon)

Visit our [docs](https://www.docs.scaffoldstark.com/) to learn how to start building with Scaffold-Stark 2.

To know more about its features, check out our [website](https://scaffoldstark.com)

## Contributing to Scaffold-Stark 2

We welcome contributions to Scaffold-Stark 2!

Please see [CONTRIBUTING.MD](https://github.com/Quantum3-Labs/scaffold-stark-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-Stark 2.
