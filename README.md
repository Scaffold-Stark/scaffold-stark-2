## Compatible versions

- scarb - 2.5.4
- cairo - 2.5.4
- node - >=18.17.0

## Quickstart

To get started with Scaffold-Stark 2, follow the steps below:

1. Clone this repo, install dependencies & install scarb package manager

```
git clone https://github.com/Quantum3-Labs/scaffold-stark-2 --recurse-submodules
cd scaffold-stark-2
yarn install
yarn postinstall #install scarb
```

2. Prepare your environment variables

```bash
cp packages/snfoundry/.env.example packages/snfoundry/.env
```

make sure you fill up the missing fields if you are using a public network, if you are using localhost, you can leave the default values.

3. Run a local network in the first terminal:

```bash
yarn chain
```

This command starts a local Starknet network using Devnet. The network runs on your local machine and can be used for testing and development.

4. On a second terminal, deploy the sample contract:

```
yarn deploy --network {NETWORK_NAME} // when NETWORK_NAME is not specified, it defaults to "devnet"
```

This command deploys a sample smart contract to the local network. The contract is located in `packages/snfoundry/src` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/snfoundry/scripts_js/deploy` to deploy the contract to the network. You can also customize the deploy script.

5. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`.

video demo [here](https://www.loom.com/share/0a0b23aa9eb34c32ad9be5b68f82817e)