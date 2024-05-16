> ⚠️ Under active development.
>

# 🏗 create-stark

CLI to create decentralized applications (dapps) using Scaffold-Stark.

This is an alternative method of installing Scaffold-Stark. Instead of directly [cloning SS-2](https://github.com/Quantum3-Labs/scaffold-stark-2?tab=readme-ov-file#quickstart), you can use create-stark to create your own custom instance, where you can choose among several configurations and extensions.

<h4 align="center">
  <a href="https://github.com/Quantum3-Labs/scaffold-stark-2">SS-2 Repo</a> |
  <a href="#">SS-2 Docs</a> |
  <a href="#">SS-2 Website</a>
</h4>

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-Stark 2, follow the steps below:

1. Install from NPM Registry and follow the CLI instructions.

```
npx create-stark@latest
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Starknet network. The network runs on your local machine and can be used for testing and development.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract can be modified to suit your needs. Is located in: `packages/snfoundry/contracts/src`

The `yarn deploy` command uses a deploy script to deploy the contract to the network. You can customize it. Is located in: `packages/snfoundry/scripts-ts`

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

**What's next**:

- Edit your smart contract `YourContract.cairo` in `packages/snfoundry/contracts/src`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/snfoundry/scripts-ts`

## Documentation

Visit our [docs](https://docs.scaffoldstark.io) to learn how to start building with Scaffold-Stark 2.

To know more about its features, check out our [website](https://scaffoldstark.io).

## Contributing to create-stark

We welcome contributions to create-stark and Scaffold-Stark 2!

For more information and guidelines for contributing, please see:

- [create-stark CONTRIBUTING.MD](https://github.com/scaffold-stark/create-stark/blob/main/CONTRIBUTING.md) if you want to contribute to the CLI.
- [Scaffold-Stark 2 CONTRIBUTING.MD](https://github.com/scaffold-stark/scaffold-stark-2/blob/main/CONTRIBUTING.md) if you want to contribute to SS-2 base code.