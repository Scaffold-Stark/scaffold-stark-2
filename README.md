## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

### Install scarb

To ensure the proper functioning of scaffold-stark, your local `Scarb` version must be `2.5.4`. To accomplish this, first check your local Scarb version:

```sh
scarb --version
```

If your local Scarb version is not `2.5.4`, you need to install it.

<details>
<summary><b>Installation Process</b></summary>

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

## Compatible versions

- scarb - v2.5.4
- cairo - v2.5.4
- starknet - v2.5.4
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

2. Prepare your environment variables. Since we are using localhost(devnet), **you can skip this step!**. But if you want use the .env file, you can fill the envs related to devnet with any predeployed contract address and private key from starknet-devnet.

**Note:** You can also use sepolia testnet, to do that, you need to fill the envs related to sepolia testnet with your own contract address and private key.

```bash
cp packages/snfoundry/.env.example packages/snfoundry/.env
```

3. Run a local network in the first terminal.

**Note:** You can skip this step if you want to use Sepolia Testnet.

```bash
yarn chain
```

This command starts a local Starknet network using Devnet. The network runs on your local machine and can be used for testing and development.

4. On a second terminal, deploy the sample contract:

```
yarn deploy --network {NETWORK_NAME} // when NETWORK_NAME is not specified, it defaults to "devnet"
```

**Note:** To use sepolia tesnet, you have to set {NETWORK_NAME} to `sepolia`.

This command deploys a sample smart contract to the local network. The contract is located in `packages/snfoundry/src` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/snfoundry/scripts_js/deploy` to deploy the contract to the network. You can also customize the deploy script.

5. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`.
