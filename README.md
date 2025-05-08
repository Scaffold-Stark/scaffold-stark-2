# 🏗 Scaffold-Stark

<h4 align="center">
  <a href="https://docs.scaffoldstark.com/">Documentation</a> |
  <a href="https://scaffoldstark.com/">Website</a> |
  <a href="https://scaffold-stark-demo.vercel.app/debug">Demo</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on Starknet blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, Starknet.js, Scarb, Starknet-React, Starknet Foundry.

- ✅ **Contract Fast Reload**: Your frontend auto-adapts to your smart contracts as you deploy them.
- 🪝 [**Custom hooks**](https://docs.scaffoldstark.com/hooks/): Collection of React hooks wrapper around [starknet-react](https://starknet-react.com/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldstark.com/components): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Prefunded Account**: Quickly test your application with a burner wallet and prefunded accounts.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with Starknet network.

![Debug Contracts tab](./packages/nextjs/public/debug-image.png)

## 0. Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## 1. Install developer tools

You can install the developer tools natively or use Dev Containers.

### Option 1: Natively install developer tools

#### 1.1 Starkup

Tool for installing all the Starknet essentials for development. [Starkup](https://github.com/software-mansion/starkup) will install the latest stable versions of:

- [Scarb](https://docs.swmansion.com/scarb/) - Cairo package manager and build toolchain
- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/index.html) - Development toolchain for testing on Starknet
- [asdf](https://asdf-vm.com/guide/getting-started.html) - Version manager to easily switch between tool versions
- [Cairo 1.0 extension](https://marketplace.visualstudio.com/items?itemName=starkware.cairo1) for VSCode - Syntax highlighting and language support

>Currently, [starknet-devnet](https://0xspaceshard.github.io/starknet-devnet/) is not supported by `starkup` and needs to be installed separately (see instructions below).

To install `starkup`, run the following command:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.starkup.sh | sh
```

#### 1.2 Create your project

Open a terminal and run the following command:

```bash
npx create-stark@latest
cd my-dapp-example
yarn install
```

Now you have a new project with the basic structure.

#### 1.3 Install Starknet Devnet using ASDF Fast Install

- Install [asdf](https://asdf-vm.com/guide/getting-started.html) in case you don't have it installed yet. It allows you to manage the other dependencies with ease.

We are almost done, now we need to install `Starknet Devnet`. First let's register the Starknet Devnet plugin on `asdf`.

```bash
asdf plugin add starknet-devnet
```

Now open your new created project. Since we have the required dependencies listed on a `.tool-versions` file, simply running the below command on the root folder will install `starknet-devnet`(and other dependencies such as `scarb` and `starknet-foundry`) with the version SPECIFIED on the `.tool-versions` file (not necessarily the latest):

```bash
asdf install
```

Now you are ready!!!. You can jump to [Quickstart 1](#quickstart-1-deploying-a-smart-contract-to-starknet-devnet) to start developing your dapp.

#### 1.4 Troubleshooting

- If you run into version errors after using `starkup` or `asdf`, you can try to install the dependencies manually. Check the details below.

<details>

#### Scarb version

To ensure the proper functioning of scaffold-stark, your `Scarb` version must be `2.11.4`. To accomplish this, first check Scarb version:

```sh
scarb --version
```

If your `Scarb` version is not `2.11.4`, you need to install it. If you already have installed `Scarb` via `starkup`, you can setup this specific version with the following command:

```sh
asdf install scarb 2.11.4 && asdf set scarb 2.11.4
```

Otherwise, you can install Scarb `2.11.4` following the [instructions](https://docs.swmansion.com/scarb/download.html#install-via-asdf).

#### Starknet Foundry version

To ensure the proper functioning of the tests on scaffold-stark, your `Starknet Foundry` version must be `0.41.0`. To accomplish this, first check your `Starknet Foundry` version:

```sh
snforge --version
```

If your `Starknet Foundry` version is not `0.41.0`, you need to install it. If you already have installed `Starknet Foundry` via `starkup`, you can setup this specific version with the following command:

```sh
asdf install starknet-foundry 0.41.0 && asdf set starknet-foundry 0.41.0
```

Otherwise, you can install Starknet Foundry `0.41.0` following the [instructions](https://foundry-rs.github.io/starknet-foundry/getting-started/installation.html#installation-via-asdf).

#### Starknet-devnet version

To ensure the proper functioning of scaffold-stark, your `starknet-devnet` version must be `0.4.0`. To accomplish this, first check your `starknet-devnet` version:

```sh
starknet-devnet --version
```

If your `starknet-devnet` version is not `0.4.0`, you need to install it.

- Install starknet-devnet `0.4.0` via `asdf` ([instructions](https://github.com/gianalarcon/asdf-starknet-devnet/blob/main/README.md)).

</details>

### Option 2. Dev Containers

#### 2.1 Install Docker Desktop

As an alternative to installing the tools locally (Scarb, Starknet Foundry, Starknet Devnet), you can use Docker, this is the recommended option for `Windows` users. Here's what you need to do:

1. Install [Docker Desktop](https://www.docker.com/get-started/)
2. Install [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Create a new project folder.

- `npx create-stark@latest`
- `cd my-dapp-example`

4. Check your project folder contains a `devcontainer.json` file. This file is used to set up the environment:

- The configuration uses the `starknetfoundation/starknet-dev:2.11.4` image.
- This includes all required tools pre-installed, such as Scarb, Starknet Foundry, Starknet Devnet and other dependencies.

#### 2.2 Getting Started with Docker Setup

To start using the Docker-based setup:

1. Open the project in **Visual Studio Code**.
2. Select **"Reopen in Container"**.
3. If you need to rebuild the container, open the Command Palette (**View -> Command Palette**) and choose:
   - **Dev Containers: Rebuild and Reopen in Container**

> Once inside the container, you can start working with all the tools and dependencies pre-configured.

Now you are ready!!!

## Compatible versions

- Starknet-devnet - v0.4.0
- Scarb - v2.11.4
- Snforge - v0.41.0
- Cairo - v2.11.4
- Rpc - v0.8.0

## Quickstart 1: Deploying a Smart Contract to Starknet-Devnet

To get started with Scaffold-Stark, follow the steps below:

1. Install the latest version of Scaffold-Stark

```bash
npx create-stark@latest
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal.

```bash
yarn chain
```

> To run a fork : `yarn chain --fork-network <URL> [--fork-block <BLOCK_NUMBER>]`

This command starts a local Starknet network using Devnet. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `scaffold.config.ts` for your nextjs app.

3. On a second terminal, deploy the sample contract:

```bash
yarn deploy
```

This command deploys a sample smart contract to the local network. The contract is located in `packages/snfoundry/contracts/src` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/snfoundry/scripts-ts/deploy.ts` to deploy the contract to the network. You can also customize the deploy script.

By default `Scaffold-Stark` takes the first prefunded account from `starknet-devnet` as a deployer address,

4. On a third terminal, start your NextJS app:

```bash
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page.

5. Check your environment variables. We have a `yarn postinstall` script that will create `.env` files based on the `.env.example` files provided. If the environment variables don't exist, you can manually create a `.env` file from the `.env.example` to get the app running!

> ⚠️ **IMPORTANT**: Never commit your private keys or sensitive environment variables to version control. The `.env` files are included in `.gitignore` by default, but always double-check before pushing your changes.

## Quickstart 2: Deploying a Smart Contract to Sepolia Testnet

<details>

1. Make sure you already cloned this repo and installed dependencies.

2. Prepare your environment variables.

Find the `packages/snfoundry/.env` file and fill the env variables related to Sepolia testnet with your own wallet account contract address and private key. Find the `packages/nextjs/.env` file and fill the env variable related to Sepolia testnet rpc url.

3. Change your default network to Sepolia testnet.

Find the `packages/nextjs/scaffold.config.ts` file and change the `targetNetworks` to `[chains.sepolia]`.

![chall-0-scaffold-config](./packages/nextjs/public/scaffold-config.png)

4. Get some testnet tokens.

You will need to get some `STRK` Sepolia tokens to deploy your contract to Sepolia testnet.

> Some popular faucets are [Starknet Faucet](https://starknet-faucet.vercel.app/) and [Blastapi Starknet Sepolia STRK](https://blastapi.io/faucets/starknet-sepolia-strk)

4. Open a terminal, deploy the sample contract to Sepolia testnet:

```bash
yarn deploy --network sepolia
```

5. On a second terminal, start your NextJS app:

```bash
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page.

</details>

## Setup RPC specific version

<details>

To ensure the proper functioning of the scaffold-stark with Testnet or Mainnet, your RPC version must be `0.8.0`. This repository contains `.env.example` files, where we provided the default RPC URL for the Starknet Testnet: `RPC_URL_SEPOLIA=https://starknet-sepolia.public.blastapi.io/rpc/v0_8`. Let's verify this RPC version is `0.8.x` by calling a `POST` request in an API platform like `Postman` or `Insommia` . Your API endpoint should be `https://starknet-sepolia.public.blastapi.io/rpc/v0_8` and the body should be:

```json
{
  "jsonrpc": "2.0",
  "method": "starknet_specVersion",
  "id": 1
}
```

You have to paste the endpoint and body in the API platform and click on the `Send` button. If the response is `0.8.x`, then you are good to go. Otherwise, you have to get the correct RPC URL endpoint.

![rpc-version](./packages/nextjs/public/rpc-version.png)

</details>

## Network Configuration Centralization

<details>

By default, Network settings are centralized in `scaffold.config.ts` with all RPC URLs defined in the `rpcProviderUrl` object. We strongly recommend to use environment variables to configure the networks, otherwise the framework will choose a random provider for you.

**How to Change Networks:**

- Update the `targetNetworks` array in `scaffold.config.ts` (first network is the primary target)
- Ensure each network has a corresponding RPC URL in the `rpcProviderUrl` object

### Required Environment Variables

Set these in your `.env` file:

- `NEXT_PUBLIC_DEVNET_PROVIDER_URL`
- `NEXT_PUBLIC_SEPOLIA_PROVIDER_URL`
- `NEXT_PUBLIC_MAINNET_PROVIDER_URL`

Configuration uses these variables with fallbacks:

```typescript
"devnet": process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL || process.env.NEXT_PUBLIC_PROVIDER_URL || "",
"sepolia": process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL || process.env.NEXT_PUBLIC_PROVIDER_URL || "",
"mainnet": process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL || process.env.NEXT_PUBLIC_PROVIDER_URL || ""
```

</details>

## CLI Usage

<details>
Depending on your package manager, substitute the word `COMMAND` with the appropiate one from the list.

```bash
yarn COMMAND
npm run COMMAND
```

This repo prefer yarn as package manager.

Commands:

| Command          | Description                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------- |
| format:check     | (Read only) Batch checks for format inconsistencies for the nextjs and snfoundry codebase |
| next:check-types | Compile typscript project                                                                 |
| next:lint        | Runs next lint                                                                            |
| prepare          | Install husky's git hooks                                                                 |
| usage            | Show this text                                                                            |

### CLI Smart Contracts

| Command         | Description                                                                         |
| --------------- | ----------------------------------------------------------------------------------- |
| compile         | Compiles contracts.                                                                 |
| test            | Runs snfoundry tests                                                                |
| chain           | Starts the local blockchain network.                                                |
| deploy          | Deploys contract to the configured network discarding previous deployments.         |
| deploy:no-reset | Deploys contract to the configured network without discarding previous deployments. |
| verify          | Verify Smart Contracts with Walnut                                                  |

### CLI Frontend

| Command     | Description                                  |
| ----------- | -------------------------------------------- |
| start       | Starts the frontend server                   |
| test:nextjs | Runs the nextjs tests                        |
| vercel      | Deploys app to vercel                        |
| vercel:yolo | Force deploy app to vercel (ignoring errors) |

## **What's next**

- Edit your smart contract `YourContract.cairo` in `packages/snfoundry/contracts/src`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/snfoundry/script-ts/deploy.ts`
- Edit your smart contract tests in `packages/snfoundry/contracts/src/test`. To run tests use `yarn test`
- You can write unit tests for your Next.js app! Run them with one the following scripts below.
  - `yarn test:nextjs` to run regular tests with watch mode
  - `yarn test:nextjs run` to run regular tests without watch mode
  - `yarn test:nextjs run --coverage` to run regular tests without watch mode with coverage

</details>

## Documentation

Visit our [docs](https://docs.scaffoldstark.com/) to learn how to start building with Scaffold-Stark.

To know more about its features, check out our [website](https://scaffoldstark.com)

## Contributing to Scaffold-Stark

We welcome contributions to Scaffold-Stark!

Please see [CONTRIBUTING.MD](https://github.com/Scaffold-Stark/scaffold-stark-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-Stark.
