## Compatible versions

- scarb - 2.5.4
- cairo - 2.5.4
- snforge - 0.19.0
- sncast - 0.19.0
- cargo - latest

## Quickstart

To get started with Scaffold-Stark 2, follow the steps below:

1. Clone this repo & install dependencies

```
git clone https://github.com/Quantum3-Labs/scaffold-stark-2 --recurse-submodules
cd scaffold-stark-2
yarn install
snfoundryup -v 0.19.0
```

2. Run a local network in the first terminal:

```bash
yarn chain
```

This command starts a local Starknet network using Devnet. The network runs on your local machine and can be used for testing and development.

3. On a second terminal, deploy the test contract:

```
yarn deploy --network {NETWORK_NAME} // when NETWORK_NAME is not specified, it defaults to "devnet"
```

This command deploys a test smart contract to the local network. The contract is located in `packages/snfoundry/src` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/snfoundry/scripts/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`.
