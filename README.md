## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Compatible versions

- scarb - v2.5.4
- cairo - v2.5.4

## Quickstart with Localhost(Devnet)

To get started with Scaffold-Stark 2, follow the steps below:

1. Clone this repo, install dependencies & install scarb package manager

```bash
git clone https://github.com/Quantum3-Labs/scaffold-stark-2 --recurse-submodules
cd scaffold-stark-2
yarn install
yarn postinstall #install scarb if needed
```

2. (Optional) Prepare your environment variables. Since we are using localhost(devnet), you can skip this step!. But if you want use the .env file, you can fill it with any predeployed contract address and private key from starknet-devnet.

```bash
cp packages/snfoundry/.env.example packages/snfoundry/.env
```

3. Run a local network in the first terminal:

```bash
yarn chain
```

This command starts a local Starknet network using Devnet. The network runs on your local machine and can be used for testing and development.

4. On a second terminal, deploy the sample contract:

```
yarn deploy
```

This command deploys a sample smart contract to the local network. The contract is located in `packages/snfoundry/src` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/snfoundry/scripts_js/deploy` to deploy the contract to the network. You can also customize the deploy script.

5. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`.

video demo [here](https://www.loom.com/share/0a0b23aa9eb34c32ad9be5b68f82817e)

## Quickstart with Sepolia Testnet

To get started with Scaffold-Stark 2, follow the steps below:

1. Clone this repo, install dependencies & install scarb package manager. You can skip this step if you have already cloned the repo and installed the dependencies.

```bash
git clone https://github.com/Quantum3-Labs/scaffold-stark-2 --recurse-submodules
cd scaffold-stark-2
yarn install
yarn postinstall #install scarb
```

2. Prepare your environment variables. You need to fill the missing fields in the `.env` file. Make sure your wallet address is already deployed and has enough funds to deploy the contract.

```bash
cp packages/snfoundry/.env.example packages/snfoundry/.env
```

This command starts a local Starknet network using Devnet. The network runs on your local machine and can be used for testing and development.

3. On your terminal, deploy the sample contract:

```
yarn deploy --network {NETWORK_NAME} // when NETWORK_NAME is not specified, it defaults to "devnet"
```

This command deploys a sample smart contract to the local network. The contract is located in `packages/snfoundry/src` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/snfoundry/scripts_js/deploy` to deploy the contract to the network. You can also customize the deploy script.

5. On a second terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`.

video demo [here](https://www.loom.com/share/0a0b23aa9eb34c32ad9be5b68f82817e)
