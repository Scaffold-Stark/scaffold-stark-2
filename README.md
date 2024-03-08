## Compatible versions

- snforge - 0.19.0
- sncast - 0.19.0

## Prerequisites [Maybe not needed ?]

- Devnet 
```bash
docker pull shardlabs/starknet-devnet-rs:0.0.2
```

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Clone this repo & install dependencies

```
git clone https://github.com/Quantum3-Labs/scaffold-stark-2 --recurse-submodules
cd scaffold-stark-2
yarn install
snfoundryup -v 0.19.0
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Starknet network using Devnet. The network runs on your local machine and can be used for testing and development.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/snfoundry/src` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/snfoundry/scripts/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`.