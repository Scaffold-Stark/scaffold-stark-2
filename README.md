## Compatible versions

- snforge - 0.19.0
- sncast - 0.19.0

## Prerequisites [Maybe not needed ?]

- Devnet

### Docker

```bash
docker pull shardlabs/starknet-devnet-rs:2c984aad70e38aa578dd5beb00ee6908ad3952b0-seed0
```

### Cargo

For those who don't have Docker installed, or dont have the enough space to pull the image, you can use the `cargo.sh` script to install the necessary dependencies.

```bash
chmod +x install-cargo.sh
./install-cargo.sh
```

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

```bash
yarn cargo-chain
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
