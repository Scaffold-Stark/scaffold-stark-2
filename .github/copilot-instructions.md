# Scaffold-Stark 2

Everything you need to build dApps on Starknet. A modern, clean version of Scaffold-Stark with NextJS, Starknet-React, Starknet.js and TypeScript. Supports Starknet Foundry for Cairo smart contracts.

## High level overview

### Smart Contract Read and Write Operations Patterns

- Read: useScaffoldReadContract (packages/nextjs/hooks/scaffold-stark/useScaffoldReadContract.ts)
- Write: useScaffoldWriteContract (packages/nextjs/hooks/scaffold-stark/useScaffoldWriteContract.ts)
- Multi-Write: useScaffoldMultiWriteContract (packages/nextjs/hooks/scaffold-stark/useScaffoldMultiWriteContract.ts)
- Event Listening: useScaffoldWatchContractEvent for real-time events (packages/nextjs/hooks/scaffold-stark/useScaffoldWatchContractEvent.ts)
- Event History: useScaffoldEventHistory for historical data (packages/nextjs/hooks/scaffold-stark/useScaffoldEventHistory.ts)

You have all the details of our custom hooks in `## Hooks` section from this file.

### Best Practice Guidance for Components usage

Use Scaffold-Stark 2 components whenever it makes sense, they are located in `packages/nextjs/components/scaffold-stark`. You have all the details about components in `## Components` section from this file.

### UI/Design System

Styling Framework:

- Base: Tailwind CSS v3
- Components: daisyUI v4
- DaisyUI Documentation: https://daisyui.com/llms.txt
- Implementation:
  - Core theme configuration: packages/nextjs/tailwind.config.ts
  - Base styling: packages/nextjs/styles/globals.css
  - Component-specific styling in individual component files

### Wallet Connection

- Supported: Starknet-React with multiple wallet connectors (packages/nextjs/services/web3/connectors.tsx)
- Custom Connect Button: packages/nextjs/components/scaffold-stark/CustomConnectButton/index.tsx

### Deployment Configuration and Network Setup

- Default chains: devnet, sepolia, mainnet (from @starknet-react/chains)
- Chains: Configured in packages/nextjs/scaffold.config.ts via the targetNetworks array
- RPC: Configured via environment variables (NEXT_PUBLIC_DEVNET_PROVIDER_URL, NEXT_PUBLIC_SEPOLIA_PROVIDER_URL, NEXT_PUBLIC_MAINNET_PROVIDER_URL)
- Provider setup: packages/nextjs/services/web3/provider.ts

Example Network Config:

```typescript
// In scaffold.config.ts
import { Chain } from "@starknet-react/chains";
import { supportedChains as chains } from "./supportedChains";

const scaffoldConfig = {
  targetNetworks: [chains.devnet], // Can be devnet, sepolia, mainnet
  pollingInterval: 30000,
  onlyLocalBurnerWallet: true,
  walletAutoConnect: true,
  autoConnectTTL: 86_400_000, // 24 hours
} as const satisfies ScaffoldConfig;
```

### disable-type-linting-error-checks

Source: https://www.scaffoldstark.com/docs/disable-type-linting-error-checks

#### ✅ Disabling Type and Linting Error Checks

:::tip Hint
TypeScript helps you catch errors at compile time, which can save time and improve code quality, but can be challenging for those who are new to the language or who are used to the more dynamic nature of JavaScript. These sections show the steps required to disable type & lint checks on different levels.
:::tip Hint

#### Disabling Commit Checks

We run the `pre-commit` [git hook](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) which lints the staged files and doesn't let you commit if there is an linting error.

To disable this, go to the `.husky/pre-commit` file and comment out `yarn lint-staged --verbose`

```diff
- yarn lint-staged --verbose
+ # yarn lint-staged --verbose
```

#### Deploying to Vercel Without Any Checks

By default, Vercel runs type and lint checks before building your app. The deployment will fail if there are any type or lint errors.

To ignore these checks while deploying from the CLI, use:

```shell
yarn vercel:yolo
```

If your repo is connected to Vercel, you can set `NEXT_PUBLIC_IGNORE_BUILD_ERROR` to `true` in an [environment variable](https://vercel.com/docs/concepts/projects/environment-variables).

#### Disabling GitHub Workflow

We have a GitHub workflow setup checkout `.github/workflows/lint.yaml` which runs type and lint error checks every time code is **pushed** to `main` branch or **pull request** is made to `main` branch.

To disable it, **delete `.github` directory**.

## Components

Scaffold-Stark 2 provides a set of pre-built components for common Starknet use cases. You can make use of them to accelerate and simplify your dapp development.

### Address

Source: https://www.scaffoldstark.com/docs/components/Address

Display a Starknet address along with a utility icon to copy the address. If the address is associated with a Starknet ID that has an avatar, this avatar will be displayed. If not, a blockie image representation of the address will be shown.

By default, the component will show the Starknet ID name (if available) and the address.

You can also choose to display only the Starknet ID name (if available) or the address, by setting the `onlyEnsOrAddress` prop to `true`.

Clicking on the address redirects to the connected wallet's network block explorer. If the wallet is not connected, it redirects to the block explorer of [`targetNetworks[0]`](/deploying/deploy-nextjs-app#--targetnetworks). You can disable this behaviour with the `disableAddressLink` prop.

#### Import

```tsx
import { Address } from "~~/components/scaffold-stark";
```

#### Usage

```tsx
<Address address="0x034aA3F359A9D614239015126635CE7732c18fDF3" />
```

#### Props

| Prop                              | Type      | Default Value | Description                                                                                                                   |
| --------------------------------- | --------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **address**                       | `string`  | `undefined`   | Address in `0x___` format, it will resolve its Starknet ID if it has one associated.                                          |
| **disableAddressLink** (optional) | `boolean` | `false`       | Set it to `true` to disable the blockexplorer link behaviour when clicking on the address.                                    |
| **format** (optional)             | `string`  | `"short"`     | By default, only the first five characters of the address are displayed. Set this to `"long"` to display the entire address.  |
| **size** (optional)               | `string`  | `"base"`      | Size for the displayed Address component. `base` by default but you can pass in `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`. |
| **onlyEnsOrAddress** (optional)   | `boolean` | `false`       | When `true`, displays only the Starknet ID name (if available) or the address, not both.                                      |

### AddressInput

Source: https://www.scaffoldstark.com/docs/components/AddressInput

Display a Starknet address input that validates the address format, resolves Starknet ID domains, and shows their avatars.

Also shows a blockie image for each address.

#### Import

```tsx
import { AddressInput } from "~~/components/scaffold-stark";
```

#### Usage

```tsx
const [address, setAddress] = useState("");
```

```tsx
<AddressInput
  onChange={setAddress}
  value={address}
  placeholder="Input your address"
/>
```

#### Props

| Prop                       | Type       | Default Value | Description                                                                  |
| -------------------------- | ---------- | ------------- | ---------------------------------------------------------------------------- |
| **value**                  | `string`   | `undefined`   | A Starknet address in (`0x___` format) or a Starknet ID domain.              |
| **onChange**               | `function` | `undefined`   | A callback invoked when the data in the address input changes.               |
| **placeholder** (optional) | `string`   | `undefined`   | The string that will be rendered before address input has been entered.      |
| **name** (optional)        | `string`   | `undefined`   | Helps identify the data being sent if AddressInput is submitted into a form. |
| **disabled** (optional)    | `boolean`  | `false`       | If `true`, sets the address input un-clickable and unusable.                 |

### Balance

Source: https://www.scaffoldstark.com/docs/components/Balance

Displays the balance of a given address in both STRK and US dollars (USD).

#### Import

```tsx
import { Balance } from "~~/components/scaffold-stark";
```

#### Usage

```tsx
<Balance address="0x034aA3F359A9D614239015126635CE7732c18fDF3" />
```

#### Props

| Prop                     | Type     | Default Value | Description                                                                                                               |
| ------------------------ | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **address**              | `string` | `undefined`   | Address in `0x___` format, it will resolve its Starknet ID if it has one associated.                                      |
| **className** (optional) | `string` | `""`          | Prop to pass additional CSS styling to the component. You can use Tailwind / daisyUI classes like `text-3xl` for styling. |

### BlockieAvatar

Source: https://www.scaffoldstark.com/docs/components/BlockieAvatar

Show a blockie (bar code profile icon) component for a given Starknet address.

The autogenerated blockie can be manually replaced by another image that we pass through the `ensImage` prop.

If you want more control over styling the blockie, you can directly use [blo](https://github.com/bpierre/blo) (pre-installed in Scaffold-Stark 2) and internally used by `BlockieAvatar` component to get the image URL.

#### Import

```tsx
import { BlockieAvatar } from "~~/components/scaffold-stark";
```

#### Usage

```tsx
<BlockieAvatar
  address="0x034aA3F359A9D614239015126635CE7732c18fDF3"
  size={24}
/>
```

#### Props

| Prop                  | Type     | Default Value | Description                                                                               |
| --------------------- | -------- | ------------- | ----------------------------------------------------------------------------------------- |
| `address`             | `string` | `undefined`   | The address for which you want to display its blockie. Ensure it's in the `0x___` format. |
| `size`                | `number` | `undefined`   | Width and Height in pixels (square).                                                      |
| `ensImage` (optional) | `string` | `undefined`   | An arbitrary image url to render instead of the blockie.                                  |

### StarkInput

Source: https://www.scaffoldstark.com/docs/components/StarkInput

Displays an input field for STRK/USD amount, with an option to convert between STRK and USD.

#### Import

```tsx
import { StarkInput } from "~~/components/scaffold-stark";
```

#### Usage

```tsx
const [strkAmount, setStrkAmount] = useState("");
```

```tsx
<StarkInput value={strkAmount} onChange={(amount) => setStrkAmount(amount)} />
```

#### Props

| Prop                       | Type       | Default Value | Description                                                                             |
| -------------------------- | ---------- | ------------- | --------------------------------------------------------------------------------------- |
| **value**                  | `string`   | `undefined`   | You can enter STRK quantity or USD quantity, but value will always be stored in STRK.   |
| **onChange**               | `function` | `undefined`   | A callback invoked when the amount in the StarkInput changes.                           |
| **placeholder** (optional) | `string`   | `undefined`   | The string that will be rendered when there is no input value.                          |
| **name** (optional)        | `string`   | `undefined`   | Helps identify the data being sent if StarkInput is submitted into a form.              |
| **disabled** (optional)    | `boolean`  | `false`       | When set to `true`, changes input background color and border to have disabled styling. |

### InputBase

Source: https://www.scaffoldstark.com/docs/components/InputBase

Simple building block for creating an input which comes with basic default styles (colors, rounded borders).

#### Import

```tsx
import { InputBase } from "~~/components/scaffold-stark";
```

#### Usage

```tsx
const [url, setUrl] = useState<string>();
```

```tsx
<InputBase name="url" placeholder="url" value={url} onChange={setUrl} />
```

#### Props

| Prop                       | Type       | Default Value | Description                                                                             |
| -------------------------- | ---------- | ------------- | --------------------------------------------------------------------------------------- |
| **value**                  | `string`   | `undefined`   | The data that your input will show.                                                     |
| **onChange**               | `function` | `undefined`   | A callback invoked when the data in the input changes.                                  |
| **placeholder** (optional) | `string`   | `undefined`   | The string that will be rendered before input data has been entered.                    |
| **name** (optional)        | `string`   | `undefined`   | Helps identify the data being sent if InputBase is submitted into a form.               |
| **error** (optional)       | `boolean`  | `false`       | When set to `true`, changes input border to have error styling.                         |
| **disabled** (optional)    | `boolean`  | `false`       | When set to `true`, changes input background color and border to have disabled styling. |

### IntegerInput

Source: https://www.scaffoldstark.com/docs/components/IntegerInput

Provides an input field for integer values, validating that user input is a valid integer, and showing error if not.
Shows by default a small button to multiply input's value \* 10^18 to transform to wei.

#### Import

```tsx
import { IntegerInput } from "~~/components/scaffold-stark";
```

#### Usage

```tsx
const [txValue, setTxValue] = useState<string | bigint>("");
```

```tsx
<IntegerInput
  value={txValue}
  onChange={(updatedTxValue) => {
    setTxValue(updatedTxValue);
  }}
  placeholder="value (wei)"
/>
```

#### Props

| Prop                       | Type       | Default Value | Description                                                                             |
| -------------------------- | ---------- | ------------- | --------------------------------------------------------------------------------------- |
| **value**                  | `string`   | `undefined`   | The data that your input will show.                                                     |
| **onChange**               | `function` | `undefined`   | A callback invoked when the amount in the input changes.                                |
| **placeholder** (optional) | `string`   | `undefined`   | The string that will be rendered before input data has been entered.                    |
| **name** (optional)        | `string`   | `undefined`   | Helps identify the data being sent if InputBase is submitted into a form.               |
| **error** (optional)       | `boolean`  | `false`       | When set to `true`, changes input border to have error styling.                         |
| **disabled** (optional)    | `boolean`  | `false`       | When set to `true`, changes input background color and border to have disabled styling. |

### CustomConnectButton

Source: https://www.scaffoldstark.com/docs/components/CustomConnectButton

Scaffold-Stark 2 uses a custom _"Connect Button"_, based on Starknet-React, that is enhanced with several useful features:

- **Balance Display**: Shows the balance of STRK from the connected address.
- **Chain Name and Color**: Displays the name of the connected Starknet network and uses a distinct color for each chain.
- **Custom Modal**: Includes copy address feature, view its QR code, access address details in blockexplorer, and disconnect.

You can extend this component to suit your app's needs.

#### Import

```tsx
import { CustomConnectButton } from "~~/components/scaffold-stark";
```

#### Usage

```tsx
<CustomConnectButton />
```

## Contributing

### 🙏 Contributing to Scaffold-Stark 2

We welcome contributions to Scaffold-Stark 2!

This section aims to provide an overview of the contribution workflow to help us make the contribution process effective for everyone involved.

:::caution
The project is under active development. You can view the open Issues, follow the development process, and contribute to the project.
:::caution

### Getting Started

You can contribute to this repo in many ways:

- Solve open issues
- Report bugs or feature requests
- Improve the documentation

Contributions are made via Issues and Pull Requests (PRs). A few general guidelines for contributions:

- Search for existing Issues and PRs before creating your own.
- Contributions should only fix/add the functionality in the issue OR address style issues, _not both_.
- If you're running into an error, please give context. Explain what you're trying to do and how to reproduce the error.
- Please use the same formatting in the code repository. You can configure your IDE to do this by using the prettier / linting config files included in each package.
- If applicable, please edit the README.md file to reflect changes.

### Issues

Source: https://www.scaffoldstark.com/docs/contributing/Issues

Issues should be used to report problems, request a new feature, or discuss potential changes before a PR is created.

#### Solve an Issue

Scan through our [existing issues](https://github.com/Scaffold-Stark/scaffold-stark-2/issues) to find one that interests you.

If a contributor is working on the issue, they will be assigned to that individual. If you find an issue to work on, you are welcome to assign it to yourself and open a PR with a fix for it.

#### Create a New Issue

If a related issue doesn't exist, you can open a new issue.

Some tips to follow when you are creating an issue:

- Provide as much context as possible. Over-communicate to give the most detail to the reader.
- Include the steps to reproduce the issue or the reason for adding the feature.
- Screenshots, videos, etc., are highly appreciated.

### pullRequests

Source: https://www.scaffoldstark.com/docs/contributing/pullRequests

#### Pull Requests

#### Pull Request Process

We follow the ["fork-and-pull" Git workflow](https://github.com/susam/gitpr)

1. Fork the repo
2. Clone the project
3. Create a new branch with a descriptive name
4. Commit your changes to the new branch
5. Push changes to your fork
6. Open a PR in our repository and tag one of the maintainers to review your PR

Here are some tips for a high-quality pull request:

- Create a title for the PR that accurately defines the work done.
- Structure the description neatly to make it easy to consume by the readers. For example, you can include bullet points and screenshots instead of having one large paragraph.
- Add the link to the issue if applicable.
- Have a good commit message that summarises the work done.

Once you submit your PR:

- We may ask questions, request additional information, or ask for changes to be made before a PR can be merged. Please note that these are to make the PR clear for everyone involved and aims to create a frictionless interaction process.
- As you update your PR and apply changes, mark each conversation resolved.

Once the PR is approved, we'll "squash-and-merge" to keep the git commit history clean.

## Deploying

Learn how to deploy your Smart Contracts to a Live Network and how to deploy your NextJS App.

### deploy-nextjs-app

Source: https://www.scaffoldstark.com/docs/deploying/deploy-nextjs-app

#### Deploy Your NextJS App

:::tip Hint
We recommend connecting your GitHub repo to Vercel (through the Vercel UI) so it gets automatically deployed when pushing to `main`.
:::tip Hint

If you want to deploy directly from the CLI, run this and follow the steps to deploy to Vercel:

```
yarn vercel
```

You might need to log in to Vercel first by running:

```
yarn vercel:login
```

Once you log in (email, GitHub, etc), the default options should work. It'll give you a public URL.

If you want to redeploy to the same production URL you can run:

```
yarn vercel --prod
```

If you omit the `--prod` flag it will deploy it to a preview/test URL.

**Make sure to check the values of your Scaffold Configuration before deploying your NextJS App.**

#### Scaffold App Configuration

You can configure different settings for your dapp at `packages/nextjs/scaffold.config.ts`.

```ts
export type ScaffoldConfig = {
  targetNetworks: readonly Chain[];
  pollingInterval: number;
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
  autoConnectTTL: number;
};
```

The configuration parameters are described below. Make sure to update the values according to your needs:

##### - targetNetworks

Array of Starknet networks where your dapp is deployed. Use values from `@starknet-react/chains` eg: `targetNetworks: [chains.sepolia]`

##### - pollingInterval

The interval in milliseconds at which your front-end application polls the RPC servers for fresh data. _Note that this setting does not affect the local network._

##### - onlyLocalBurnerWallet

Controls the networks where the Burner Wallet feature is available. This feature provides a lightweight wallet for users.

- `true` => Use Burner Wallet only on devnet network.
- `false` => Use Burner Wallet on all networks.

##### - walletAutoConnect

Set it to `true` to activate automatic wallet connection behavior:

- If the user was connected into a wallet before, on page reload it reconnects automatically.
- If the user is not connected to any wallet, on reload, it connects to the burner wallet _if it is enabled for the current network_. See `onlyLocalBurnerWallet`

##### - autoConnectTTL

Time-to-live for the auto-connect feature in milliseconds. Default is 24 hours (86_400_000).

You can extend this configuration file, adding new parameters that you need to use across your dapp **(make sure you update the above type `ScaffoldConfig`)**:

```ts
  tokenIcon: "🪙",
```

To use the values from the `ScaffoldConfig` in any other file of your application, you first need to import it in those files:

```ts
import scaffoldConfig from "~~/scaffold.config";
```

### deploy-smart-contracts

Source: https://www.scaffoldstark.com/docs/deploying/deploy-smart-contracts

#### Deploy Your Smart Contracts

To deploy your smart contracts to a live network, there are a few things you need to adjust.

#### 1. Configure your network

Scaffold-Stark 2 comes with a selection of predefined networks (devnet, sepolia, mainnet). The networks are configured in:

- `packages/nextjs/scaffold.config.ts` - for frontend
- `packages/snfoundry/scripts-ts/helpers/networks.ts` - for deployment scripts

#### 2. Setup environment variables

Create a `.env` file in `packages/snfoundry/` and add your deployer account details:

```
# Devnet
ACCOUNT_ADDRESS_DEVNET=0x...
PRIVATE_KEY_DEVNET=0x...

# Sepolia
ACCOUNT_ADDRESS_SEPOLIA=0x...
PRIVATE_KEY_SEPOLIA=0x...

# Mainnet
ACCOUNT_ADDRESS_MAINNET=0x...
PRIVATE_KEY_MAINNET=0x...
```

Also configure RPC URLs in `packages/nextjs/.env`:

```
NEXT_PUBLIC_DEVNET_PROVIDER_URL=http://127.0.0.1:5050
NEXT_PUBLIC_SEPOLIA_PROVIDER_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9
NEXT_PUBLIC_MAINNET_PROVIDER_URL=https://starknet-mainnet.public.blastapi.io/rpc/v0_9
```

#### 3. Deploy your smart contract(s)

By default `yarn deploy` will deploy all the contracts from your `packages/snfoundry/contracts/src` folder to devnet.

To deploy to a specific network:

```
yarn deploy --network sepolia
```

This command deploys contracts using the deploy script located in `packages/snfoundry/scripts-ts/deploy.ts`. You can customize the deployment script to suit your needs.

#### 4. Verify your smart contract

You can verify your smart contract on the appropriate block explorer by running:

```
yarn verify --network network_name
```

eg: `yarn verify --network sepolia`

#### Configuration of Third-Party Services for Production-Grade Apps.

By default, Scaffold-Stark 2 provides predefined RPC endpoints. For production-grade applications, it's recommended to obtain your own RPC endpoints to prevent rate limiting issues.

:::tip Hint
It's recommended to store envs for nextjs in Vercel/system env config for live apps and use .env.local for local testing.
:::tip Hint

## External-contracts

### 📡 Interacting with External Contracts

If you need to interact with external contracts (i.e. not deployed with your Scaffold-Stark 2 instance, e.g [`ERC20`](https://starkscan.co/contract/0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7#overview) contract) you can add external contract data to your `packages/nextjs/contracts/externalContracts.ts` file, which would let you use Scaffold-Stark 2 [custom hooks](/hooks).

To achieve this, include the contract name, its `address`, and `abi` in `externalContracts.ts` for each chain ID. Ensure to update the [`targetNetworks`](/deploying/deploy-nextjs-app#--targetnetworks) in `scaffold.config.ts` to your preferred chains to enable hooks typescript autocompletion.

This is the structure of `externalContracts` object:

```ts
const externalContracts = {
  "0x534e5f4d41494e": { // Starknet Mainnet
    DAI: {
      address: "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3",
      abi: [...],
    },
    STRK: {
      address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      abi: [...],
    },
  },
  "0x534e5f5345504f4c4941": { // Starknet Sepolia
    DAI: {
      address: "0x...",
      abi: [...],
    },
    STRK: {
      address: "0x...",
      abi: [...],
    },
  },
} as const;
```

## Hooks

### 🛠 Interacting with Your Smart Contracts

Scaffold-Stark 2 provides a collection of custom React hooks designed to simplify interactions with your deployed smart contracts. These hooks are wrappers around Starknet-React, an easy-to-use interface with typescript autocompletions for reading from, writing to, and monitoring events emitted by your smart contracts.

To ensure autocompletions function correctly, always update the [`targetNetworks` ](/deploying/deploy-nextjs-app#--targetnetworks) in `scaffold.config.ts` to include the relevant network/chain whenever you deploy your contract using [`yarn deploy --network`](/deploying/deploy-smart-contracts#3-deploy-your-smart-contracts).

:::info
The custom hooks rely on three main files for their functionality and TypeScript autocompletion:

- `packages/nextjs/contracts/deployedContracts.ts`
- [`packages/nextjs/contracts/externalContracts.ts`](/external-contracts)
- `scaffold.config.ts`

The `deployedContracts.ts` file is auto-generated/updated whenever you run `yarn deploy --network`. It organizes contract addresses and abi's based on chainId.

:::

:::note

When having multiple chains configured in [`targetNetworks`](/deploying/deploy-nextjs-app#--targetnetworks), make sure to have same contractName's on other chains as `targetNetworks[0].id`.This ensures proper functionality and autocompletion of custom hooks, as the current setup and types assumes that same contract's are present on other chains as `targetNetworks[0]`.

:::

### useDeployedContractInfo

Source: https://www.scaffoldstark.com/docs/hooks/useDeployedContractInfo

Use this hook to fetch details about a deployed smart contract, including the ABI and address.

```ts
const { data: deployedContractData } = useDeployedContractInfo({
  contractName: "YourContract",
});
```

This example retrieves the details of the deployed contract with the specified name and stores the details in the `deployedContractData` object.

#### Configuration

| Parameter              | Type     | Description                                                                                                                |
| :--------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------- |
| **contractName**       | `string` | Name of the contract.                                                                                                      |
| **chainId** (optional) | `string` | Id of the chain the contract lives on. Defaults to [`targetNetworks[0].id`](/deploying/deploy-nextjs-app#--targetnetworks) |

#### Return Value

- `data`: Object containing `address` and `abi` of contract.

### useScaffoldContract

Source: https://www.scaffoldstark.com/docs/hooks/useScaffoldContract

Use this hook to get your contract instance by providing the contract name. It enables you to interact with your contract methods.
For reading data or sending transactions, it's recommended to use `useScaffoldReadContract` and `useScaffoldWriteContract`.

```ts
const { data: yourContract } = useScaffoldContract({
  contractName: "YourContract",
});
// Returns the greeting and can be called in any function, unlike useScaffoldReadContract
await yourContract?.call("greeting");

// Used to write to a contract and can be called in any function
import { useAccount } from "@starknet-react/core";

const { account } = useAccount();
const { data: yourContract } = useScaffoldContract({
  contractName: "YourContract",
});

const setGreeting = async () => {
  if (account && yourContract) {
    yourContract.connect(account);
    // Call the method in any function
    await yourContract.invoke("set_greeting", ["the greeting here"]);
  }
};
```

This example uses the `useScaffoldContract` hook to obtain a contract instance for the `YourContract` smart contract.

#### Configuration

| Parameter        | Type     | Description           |
| :--------------- | :------- | :-------------------- |
| **contractName** | `string` | Name of the contract. |

#### Return Value

- `data` : Object representing Starknet.js's [contract instance](https://www.starknetjs.com/docs/guides/create_contract/). Which can be used to call `call` and `invoke` methods of the contract.

- `isLoading` : Boolean indicating if the contract is being loaded.

### useScaffoldEventHistory

Source: https://www.scaffoldstark.com/docs/hooks/useScaffoldEventHistory

Use this hook to retrieve historical event logs for your smart contract, providing past activity data, with the option to watch for new events.

```ts
const {
  data: events,
  isLoading: isLoadingEvents,
  error: errorReadingEvents,
} = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "GreetingChanged",
  fromBlock: 31231n,
  watch: true,
  filters: { greeting_setter: "0x9eB2C4866aAe575bC88d00DE5061d5063a1bb3aF" },
  blockData: true,
  transactionData: true,
  receiptData: true,
});
```

This example retrieves the historical event logs for the `GreetingChanged` event of the `YourContract` smart contract, starting from block number 31231 and filtering events where the `greeting_setter` parameter is `0x9eB2C4866aAe575bC88d00DE5061d5063a1bb3aF`.

#### Configuration

| Parameter                      | Type      | Description                                                                                                                                                           |
| :----------------------------- | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **contractName**               | `string`  | Name of the contract to read from.                                                                                                                                    |
| **eventName**                  | `string`  | Name of the event to read.                                                                                                                                            |
| **fromBlock**                  | `bigint`  | Block number from which to start reading events.                                                                                                                      |
| **toBlock**                    | `bigint`  | block number to stop reading events at (if not provided, reads until current block)                                                                                   |
| **filters** (optional)         | `object`  | Apply filters to the event based on **indexed** parameter names and values `{ [parameterName]: value }`.                                                              |
| **blockData** (optional)       | `boolean` | If set to true it will return the block data for each event (default: false).                                                                                         |
| **transactionData** (optional) | `boolean` | If set to true it will return the transaction data for each event (default: false).                                                                                   |
| **receiptData** (optional)     | `boolean` | If set to true it will return the receipt data for each event (default: false).                                                                                       |
| **watch** (optional)           | `boolean` | If set to true, the events will be refetched every [`pollingInterval`](/deploying/deploy-nextjs-app#--pollinginterval) set at `scaffold.config.ts`. (default: false). |
| **enabled** (optional)         | `boolean` | If set to false, the hook will not fetch any data (default: true).                                                                                                    |
| **chainId** (optional)         | `string`  | Id of the chain the contract lives on. Defaults to [`targetNetworks[0].id`](/deploying/deploy-nextjs-app#--targetnetworks)                                            |
| **blocksBatchSize** (optional) | `number`  | batch size for fetching events. If specified, each batch will contain at most this many blocks (default: 500)                                                         |

#### Return Values

- `data` property of the returned object contains an array of event objects, each containing the event parameters and (optionally) the block, transaction, and receipt data.
- `isLoading` property indicates whether the event logs are currently being fetched.
- `error` property contains any error that occurred during the fetching process (if applicable).

### useScaffoldReadContract

Source: https://www.scaffoldstark.com/docs/hooks/useScaffoldReadContract

Use this hook to read public variables and get data from read-only functions of your smart contract.

```ts
const { data: totalCounter } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "user_greeting_counter",
  args: ["0xd8da6bf26964af9d7eed9e03e53415d37aa96045"],
});
```

This example retrieves the data returned by the `user_greeting_counter` function of the `YourContract` smart contract.

#### Configuration

| Parameter              | Type        | Description                                                                                                                |
| :--------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------- |
| **contractName**       | `string`    | Name of the contract to read from.                                                                                         |
| **functionName**       | `string`    | Name of the function to call.                                                                                              |
| **args** (optional)    | `unknown[]` | Array of arguments to pass to the function (if accepts any). Types are inferred from contract's function parameters        |
| **watch** (optional)   | `boolean`   | Watches and refreshes data on new blocks. (default : `true`)                                                               |
| **chainId** (optional) | `string`    | Id of the chain the contract lives on. Defaults to [`targetNetworks[0].id`](/deploying/deploy-nextjs-app#--targetnetworks) |

You can also pass other arguments accepted by [useReadContract starknet-react hook](https://starknet-react.com/docs/hooks/useReadContract#parameters).

#### Return Values

- The retrieved data is stored in the `data` property of the returned object.
- You can refetch the data by calling the `refetch` function.
- The extended object includes properties inherited from starknet-react useReadContract. You can check the [useReadContract return values](https://starknet-react.com/docs/hooks/useReadContract#return-type) documentation to check the types.

### useScaffoldWatchContractEvent

Source: https://www.scaffoldstark.com/docs/hooks/useScaffoldWatchContractEvent

Use this hook to subscribe to events emitted by your smart contract, and receive real-time updates when these events are emitted.

```ts
useScaffoldWatchContractEvent({
  contractName: "YourContract",
  eventName: "GreetingChanged",
  // The onLogs function is called whenever a GreetingChanged event is emitted by the contract.
  // Parameters emitted by the event can be destructed using the below example
  // for this example: event GreetingChanged(greeting_setter: ContractAddress, new_greeting: felt252, premium: bool, value: u256);
  onLogs: (logs) => {
    logs.map((log) => {
      const { greeting_setter, value, premium, new_greeting } = log.args;
      console.log(
        "📡 GreetingChanged event",
        greeting_setter,
        value,
        premium,
        new_greeting,
      );
    });
  },
});
```

This example subscribes to the `GreetingChanged` event emitted by the `YourContract` smart contract and logs the parameters from the event to the console when it's emitted.

This hook is a wrapper around starknet-react's [useWatchContractEvent](https://starknet-react.com/docs/hooks/useWatchContractEvent).

:::note
Due to shortcomings of some RPC providers, this hook may or may not fire events always. To update the RPC link checkout [this section](/deploying/deploy-nextjs-app#rpc-configuration)
:::

#### Configuration

| Parameter              | Type       | Description                                                                                                                                                                                                                                                                                                                                                                           |
| :--------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **contractName**       | `string`   | Name of the contract to read from.                                                                                                                                                                                                                                                                                                                                                    |
| **eventName**          | `string`   | Name of the event to read.                                                                                                                                                                                                                                                                                                                                                            |
| **onLogs**             | `function` | Callback function to execute when the event is emitted. Accepts an array of `logs` that occurred during the [`pollingInterval`](/deploying/deploy-nextjs-app#--pollinginterval) set at `scaffold.config.ts`. Each array item contains an `args` property, which can be destructured to get the parameters emitted by the event. This function can customized according to your needs. |
| **chainId** (optional) | `string`   | Id of the chain the contract lives on. Defaults to [`targetNetworks[0].id`](/deploying/deploy-nextjs-app#--targetnetworks)                                                                                                                                                                                                                                                            |

:::note

It is recommended to `setState` using [updater function](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state) in the `onLogs` function to avoid problems due to caching.

:::

### useScaffoldWriteContract

Source: https://www.scaffoldstark.com/docs/hooks/useScaffoldWriteContract

Use this hook to send a transaction to your smart contract to write data or perform an action.

```ts
const { sendAsync: writeYourContractAsync } = useScaffoldWriteContract({
  contractName: "YourContract",
  functionName: "set_greeting",
  args: ["Hello World!"],
});
```

The following configuration options can be passed to the hook:

#### Configuration

| Parameter              | Type        | Description                                                                                                                |
| :--------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------- |
| **contractName**       | `string`    | Name of the contract to write to.                                                                                          |
| **functionName**       | `string`    | Name of the function to call.                                                                                              |
| **args** (optional)    | `unknown[]` | Array of arguments to pass to the function (if accepts any). Types are inferred from contract's function parameters.       |
| **chainId** (optional) | `string`    | Id of the chain the contract lives on. Defaults to [`targetNetworks[0].id`](/deploying/deploy-nextjs-app#--targetnetworks) |

To send the transaction, you can call the `sendAsync` function returned by the hook (which we instance as `writeYourContractAsync`). Here's an example usage:

```tsx
<button
  className="btn btn-primary"
  onClick={async () => {
    try {
      await writeYourContractAsync();
    } catch (e) {
      console.error("Error setting greeting:", e);
    }
  }}
>
  Set Greeting
</button>
```

This example sends a transaction to the `YourContract` smart contract to call the `set_greeting` function with the arguments passed to the hook. The `sendAsync` function (`writeYourContractAsync` instance) sends the transaction to the smart contract.

You can also override arguments when calling:

```tsx
await writeYourContractAsync({ args: ["New Greeting!"] });
```

#### Return Values

- `sendAsync` function sends the transaction to the smart contract.
- `isLoading` property indicates whether the transaction is currently being processed.
- The extended object includes properties inherited from starknet-react useSendTransaction. You can check the [useSendTransaction return values](https://starknet-react.com/docs/hooks/useSendTransaction#return-type) documentation to check the types.

### useTransactor

Source: https://www.scaffoldstark.com/docs/hooks/useTransactor

Use this hook to interact with the Starknet network and give UI feedback on the transaction status.

Any error will show a popup with nice error message.

```ts
const transactor = useTransactor();
const writeTx = transactor.writeTransaction;
const calls = [
  {
    contractAddress: "0x97843608a00e2bbc75ab0C1911387E002565DEDE",
    entrypoint: "transfer",
    calldata: ["0x123...", "1000000000000000000", "0"],
  },
];
await writeTx(calls);
```

This example tries to send a transaction with the provided calls, prompting the connected wallet for a signature. And in the case of a successful transaction, it will show a popup in the UI with the message: "🎉 Transaction completed successfully!".

You can pass in an array of calls to be executed in a single transaction. It also supports Cairo 1.0 multicall functionality.

#### Configuration

#### useTransactor

| Parameter                     | Type                                                                         | Description                                                                                           |
| :---------------------------- | :--------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **\_walletClient** (optional) | [`AccountInterface`](https://www.starknetjs.com/docs/guides/connect_account) | The wallet client that should sign the transaction. Defaults to the connected account from useAccount |

#### writeTransaction function

| Parameter              | Type     | Description                                                                                                       |
| :--------------------- | :------- | :---------------------------------------------------------------------------------------------------------------- |
| **calls**              | `Call[]` | Array of calls to execute in the transaction. Each call should contain contractAddress, entrypoint, and calldata. |
| **options** (optional) | `object` | Additional options for the transaction.                                                                           |

#### Return Values

#### useTransactor

- `writeTransaction`: Function that is used to send transactions with UI feedback.
- `sendTransactionInstance`: The underlying useSendTransaction instance.
- `transactionReceiptInstance`: The transaction receipt data.

#### writeTransaction function

- A promise that resolves with the transaction hash once the transaction is submitted.

## Quick-start

### environment

Source: https://www.scaffoldstark.com/docs/quick-start/environment

Now that our installation is complete, let's configure the development environment for Scaffold-Stark 2.

#### 1. **Initialize a Local Blockchain**:

In the first terminal, run a local network:

```
yarn chain
```

This command starts a local Starknet network using starknet-devnet. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `scaffold.config.ts` for your nextjs app.

#### 2. **Deploy Your Smart Contract**:

In the second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract can be modified to suit your needs and can be found in:

```sh
packages/snfoundry/contracts/src
```

The `yarn deploy` command uses a deploy script to deploy the contract to the network. You can customize the deployment script located in:

```sh
packages/snfoundry/scripts-ts/deploy.ts
```

#### 3. **Launch your NextJS Application**:

In the third terminal, start your NextJS app:

```
yarn start
```

Visit your app on `http://localhost:3000`. You can interact with your smart contract using the contract component or the example ui in the frontend.

#### What's Next:

- Edit your smart contract:
  - `your_contract.cairo` in `packages/snfoundry/contracts/src`
- Edit your deployment scripts:
  - `packages/snfoundry/scripts-ts/deploy.ts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit the app config in `packages/nextjs/scaffold.config.ts`
- Edit your smart contract test in:
  - `packages/snfoundry/contracts/tests` to run test use `yarn test`

### installation

Source: https://www.scaffoldstark.com/docs/quick-start/installation

#### Requirements

Before you begin, you need to install the following tools:

- [Node (>= v22)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

#### Setup

For a simplified setup, Scaffold-Stark 2 offers a npx tool that guides you interactively through the setup:

```
npx create-stark@latest
```

You will be presented with a series of prompts:

- **Project Name:** Enter a name for your project, e.g., my-dapp-example.
- **Development Tools:** Choose your preferred development environment (native tools or Dev Containers)

Once the setup is complete, navigate to the project directory:

```
cd project-name
```

If you want to use extensions, you can add the -e flag followed by the extension name:

```
npx create-stark@latest -e extension-name
```

For more information about available extensions and how to use them, check out the [Extensions section](/extensions)

## Recipes

Explore a collection of practical recipes to implement common web3 use-cases with Scaffold-Stark 2. Learn how to interact with smart contracts, read and display data, manage account balances, and more. Each recipe offers step-by-step guidance, making it easy to implement different blockchain features into your dApps.

### add-custom-chain

Source: https://www.scaffoldstark.com/docs/recipes/add-custom-chain

#### Add a custom chain

This recipe demonstrates how to add a custom chain to your project. We'll use a custom Starknet network as an example, but you can apply this process to any other Starknet-compatible network you want to add.

Scaffold-Stark 2 uses [@starknet-react/chains](https://starknet-react.com/docs/chains) as a list of chains.
Normally, devnet, sepolia, and mainnet already exist in @starknet-react/chains and [you can import them and use them](/deploying/deploy-nextjs-app#--targetnetworks), but we're going to add a custom network manually to show you how to do it.

:::info
Scaffold-Stark 2 consists of two parts:

- `packages/nextjs`: nextjs frontend
- `packages/snfoundry`: starknet foundry to deploy smart contracts

The frontend and the snfoundry project use a different set of chains.
You should add the chain to both the frontend and your snfoundry config. Checkout [deploying your smart contract](/deploying/deploy-smart-contracts) section on how to deploy to different chains.

By doing this, you will be able to deploy the contracts to the chain you added and interact with them from the frontend.

:::

#### Step 1: Define the chain

First, create a new file called `customChains.ts` in your `packages/nextjs/utils/` directory.

Open the file with your favorite editor and add the following code to define the chain.

```typescript title="packages/nextjs/utils/customChains.ts"
import { Chain } from "@starknet-react/chains";

// Custom Starknet chain
export const customStarknet: Chain = {
  id: "0x534e5f43555354444d", // SN_CUSTOM in hex
  network: "custom",
  name: "Custom Starknet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://your-custom-rpc-endpoint.com"],
    },
    public: {
      http: ["https://your-custom-rpc-endpoint.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Custom Explorer",
      url: "https://your-custom-explorer.com",
    },
  },
  testnet: true, // or false if it's mainnet
};
```

In this file, we're defining a custom Starknet chain. You can add as many chains as you want to the `customChains.ts` file.

#### Step 2: Update `scaffold.config.ts`

Next, update your `scaffold.config.ts` file to include the new chain:

```typescript title="packages/nextjs/scaffold.config.ts"
import { customStarknet } from "./utils/customChains";
// ... other imports and type definitions

const scaffoldConfig = {
  targetNetworks: [customStarknet],
  // ... other configuration options
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
```

If you'd like to add multiple chains, you can do so by adding them to the `targetNetworks` array. Below is a simple example of how to add multiple chains.

```typescript title="packages/nextjs/scaffold.config.ts"
import { customStarknet, anotherCustomChain } from "./utils/customChains";

const scaffoldConfig = {
  targetNetworks: [customStarknet, anotherCustomChain],
  // ... other configuration options
} as const satisfies ScaffoldConfig;
```

### GetCurrentBalanceFromAccount

Source: https://www.scaffoldstark.com/docs/recipes/GetCurrentBalanceFromAccount

#### Get the Current Balance of the Connected Account

This recipe shows how to fetch and display the STRK balance of the currently connected account.

<details open>
<summary>Here is the full code, which we will be implementing in the guide below:</summary>

```tsx title="components/ConnectedAddressBalance.tsx"
import { useAccount } from "@starknet-react/core";
import { Address, Balance } from "~~/components/scaffold-stark";

export const ConnectedAddressBalance = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <div className="bg-base-300 p-6 rounded-lg max-w-md mx-auto mt-6">
      <h2 className="text-lg font-bold mb-2">Your Starknet Balance</h2>

      <div className="text-sm font-semibold mb-2">
        Address: <Address address={connectedAddress} />
      </div>

      <div className="text-sm font-semibold">
        Balance: <Balance address={connectedAddress} />
      </div>
    </div>
  );
};
```

</details>

#### Implementation guide

#### Step 1: Create a new Component

Begin by creating a new component in the "components" folder of your application.

```tsx title="components/ConnectedAddressBalance.tsx"
export const ConnectedAddressBalance = () => {
  return (
    <div>
      <h2>Your Starknet Balance</h2>
    </div>
  );
};
```

#### Step 2: Retrieve the Connected Account

Fetch the Starknet address of the currently connected account using the [useAccount starknet-react hook](https://starknet-react.com/docs/hooks/useAccount) and easily display them using Scaffold-Stark 2 [Address](/components/Address) and [Balance](/components/Balance) components.

```tsx title="components/ConnectedAddressBalance.tsx"
// highlight-start
import { useAccount } from "@starknet-react/core";
import { Address, Balance } from "~~/components/scaffold-stark";
// highlight-end

export const ConnectedAddressBalance = () => {
  // highlight-start
  const { address: connectedAddress } = useAccount();
  // highlight-end

  return (
    <div>
      <h2>Your Starknet Balance</h2>
      {/* highlight-start */}
      Address: <Address address={connectedAddress} />
      Balance: <Balance address={connectedAddress} />
      {/* highlight-end */}
    </div>
  );
};
```

### ReadUintFromContract

Source: https://www.scaffoldstark.com/docs/recipes/ReadUintFromContract

#### Read a `u256` from a contract

This recipe demonstrates how to read data from contract functions and display it on the UI. We'll showcase an example that accepts some arguments (parameters), and another with no arguments at all.

<details open>
<summary>Here is the full code, which we will be implementing in the guide below:</summary>

```tsx title="components/GreetingsCount.tsx"
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark";

export const GreetingsCount = () => {
  const { address: connectedAddress } = useAccount();

  const { data: totalCounter, isLoading: isTotalCounterLoading } =
    useScaffoldReadContract({
      contractName: "YourContract",
      functionName: "total_counter",
    });

  const {
    data: connectedAddressCounter,
    isLoading: isConnectedAddressCounterLoading,
  } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "user_greeting_counter",
    args: [connectedAddress], // passing args to function
  });

  return (
    <div className="card card-compact w-64 bg-secondary text-primary-content shadow-xl m-4">
      <div className="card-body items-center text-center">
        <h2 className="card-title">Greetings Count</h2>
        <div className="card-actions items-center flex-col gap-1 text-lg">
          <h2 className="font-bold m-0">Total Greetings count:</h2>
          {isTotalCounterLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <p className="m-0">{totalCounter ? totalCounter.toString() : 0}</p>
          )}
          <h2 className="font-bold m-0">Your Greetings count:</h2>
          {isConnectedAddressCounterLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <p className="m-0">
              {connectedAddressCounter ? connectedAddressCounter.toString() : 0}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
```

</details>

#### Implementation guide

#### Step 1: Create a new Component

Begin by creating a new component in the "components" folder of your application.

```tsx title="components/GreetingsCount.tsx"
export const GreetingsCount = () => {
  return (
    <div>
      <h2 className="font-bold m-0">Total Greetings count:</h2>
      <h2 className="font-bold m-0">Your Greetings count:</h2>
    </div>
  );
};
```

#### Step 2: Retrieve total greetings count

Initialize the [useScaffoldReadContract](/hooks/useScaffoldReadContract) hook to read from the contract. This hook provides the `data` which contains the return value of the function.

```tsx title="components/GreetingsCount.tsx"
//highlight-start
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark";
// highlight-end

export const GreetingsCount = () => {
  // highlight-start
  const { data: totalCounter } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "total_counter",
  });
  // highlight-end

  return (
    <div>
      <h2 className="font-bold m-0">Total Greetings count:</h2>
      //highlight-start
      <p>{totalCounter ? totalCounter.toString() : 0}</p>
      //highlight-end
      <h2 className="font-bold m-0">Your Greetings count:</h2>
    </div>
  );
};
```

In the line `const {data: totalCounter} = useScaffoldReadContract({...})` we are using [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to assign `data` to a new name `totalCounter`.

In the contract, `total_counter` returns a `u256` value, which is represented as a [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) in javascript and can be converted to a readable string using `.toString()`.

#### Step 3: Retrieve connected address greetings count

We can get the connected address using the [useAccount](https://starknet-react.com/docs/hooks/useAccount) hook and pass it to `args` key in the `useScaffoldReadContract` hook configuration. This will be used as an argument to read the contract function.

```tsx title="components/GreetingsCount.tsx"
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark";
//highlight-start
import { useAccount } from "@starknet-react/core";
//highlight-end

export const GreetingsCount = () => {
  //highlight-start
  const { address: connectedAddress } = useAccount();
  //highlight-end

  const { data: totalCounter } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "total_counter",
  });

  //highlight-start
  const { data: connectedAddressCounter } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "user_greeting_counter",
    args: [connectedAddress], // passing args to function
  });
  //highlight-end

  return (
    <div>
      <h2>Total Greetings count:</h2>
      <p>{totalCounter ? totalCounter.toString() : 0}</p>
      <h2>Your Greetings count:</h2>
      //highlight-start
      <p>{connectedAddressCounter ? connectedAddressCounter.toString() : 0}</p>
      //highlight-end
    </div>
  );
};
```

#### Step 4: Bonus adding loading state

We can use `isLoading` returned from the [`useScaffoldReadContract`](/hooks/usescaffoldreadcontract) hook. This variable is set to `true` while fetching data from the contract.

```tsx title="components/GreetingsCount.tsx"
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark";
import { useAccount } from "@starknet-react/core";

export const GreetingsCount = () => {
  const { address: connectedAddress } = useAccount();

  // highlight-start
  const { data: totalCounter, isLoading: isTotalCounterLoading } =
    useScaffoldReadContract({
      // highlight-end
      contractName: "YourContract",
      functionName: "total_counter",
    });

  // highlight-start
  const {
    data: connectedAddressCounter,
    isLoading: isConnectedAddressCounterLoading,
  } = useScaffoldReadContract({
    // highlight-end
    contractName: "YourContract",
    functionName: "user_greeting_counter",
    args: [connectedAddress], // passing args to function
  });

  return (
    <div>
      <h2>Total Greetings count:</h2>
      // highlight-start
      {isTotalCounterLoading ? (
        <span className="loading loading-spinner"></span>
      ) : (
        <p className="m-0">{totalCounter ? totalCounter.toString() : 0}</p>
      )}
      // highlight-end
      <h2>Your Greetings count:</h2>
      // highlight-start
      {isConnectedAddressCounterLoading ? (
        <span className="loading loading-spinner"></span>
      ) : (
        <p className="m-0">
          {connectedAddressCounter ? connectedAddressCounter.toString() : 0}
        </p>
      )}
      // highlight-end
    </div>
  );
};
```

### StarknetContractWriteWithFeedback

Source: https://www.scaffoldstark.com/docs/recipes/StarknetContractWriteWithFeedback

#### Starknet contract write with transaction status

This recipe demonstrates how to create a button for contract interaction using the "useTransactor" and "useSendTransaction" hooks from the "starknet-react" library. The interaction includes the capability to provide feedback on the transaction status when using starknet-react `useSendTransaction`.

<details open>
<summary>Here is the full code, which we will be implementing in the guide below:</summary>

```tsx title="components/ContractInteraction.tsx"
import * as React from "react";
import { useSendTransaction } from "@starknet-react/core";
import { useTransactor } from "~~/hooks/scaffold-stark";

export const ContractInteraction = () => {
  const { sendAsync, isPending } = useSendTransaction({
    calls: [
      {
        contractAddress: "0x034aA3F359A9D614239015126635CE7732c18fDF3",
        entrypoint: "set_greeting",
        calldata: ["0x48656c6c6f20576f726c6421"], // "Hello World!" in hex
      },
    ],
  });

  const writeTx = useTransactor();

  const handleSetGreeting = async () => {
    try {
      await writeTx.writeTransaction(sendAsync);
    } catch (e) {
      console.log("Unexpected error in writeTx", e);
    }
  };

  return (
    <button
      className="btn btn-primary"
      onClick={handleSetGreeting}
      disabled={isPending}
    >
      {isPending ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        "Send"
      )}
    </button>
  );
};
```

</details>

#### Implementation

#### Step 1: Set Up Your Component

Create a new component in the "components" folder. The component will show a button that will allow users to interact with your smart contract.

```tsx title="components/ContractInteraction.tsx"
import * as React from "react";

export const ContractInteraction = () => {
  return <button>Send</button>;
};
```

#### Step 2: Configure starknet-react's `useSendTransaction` hook

Add starknet-react's `useSendTransaction` hook and configure it with the transaction calls.

```tsx
import * as React from "react";
// highlight-start
import { useSendTransaction } from "@starknet-react/core";
// highlight-end

export const ContractInteraction = () => {
  // highlight-start
  const { sendAsync } = useSendTransaction({
    calls: [
      {
        contractAddress: "0x034aA3F359A9D614239015126635CE7732c18fDF3",
        entrypoint: "set_greeting",
        calldata: ["0x48656c6c6f20576f726c6421"], // "Hello World!" in hex
      },
    ],
  });
  // highlight-end
  return <button>Send</button>;
};
```

#### Step 3: Initialize `useTransactor` hook and send transaction

Initialize the `useTransactor` hook, and use it to wrap the `sendAsync` function to show feedback transaction status to user.

```tsx
import * as React from "react";
import { useSendTransaction } from "@starknet-react/core";
// highlight-start
import { useTransactor } from "~~/hooks/scaffold-stark";
// highlight-end

export const ContractInteraction = () => {
  const { sendAsync } = useSendTransaction({
    calls: [
      {
        contractAddress: "0x034aA3F359A9D614239015126635CE7732c18fDF3",
        entrypoint: "set_greeting",
        calldata: ["0x48656c6c6f20576f726c6421"],
      },
    ],
  });

  // highlight-start
  const writeTx = useTransactor();
  // highlight-end

  // highlight-start
  return (
    <button onClick={() => writeTx.writeTransaction(sendAsync)}>Send</button>
  );
  // highlight-end
};
```

#### Step 4: Wrap `useTransactor` in a handler async function

Wrap the `writeTx.writeTransaction` function in a handler function to start the transaction when the user clicks the button.

```tsx
import * as React from "react";
import { useSendTransaction } from "@starknet-react/core";
import { useTransactor } from "~~/hooks/scaffold-stark";

export const ContractInteraction = () => {
  const { sendAsync, isPending } = useSendTransaction({
    calls: [
      {
        contractAddress: "0x034aA3F359A9D614239015126635CE7732c18fDF3",
        entrypoint: "set_greeting",
        calldata: ["0x48656c6c6f20576f726c6421"],
      },
    ],
  });

  const writeTx = useTransactor();

  // highlight-start
  const handleSetGreeting = async () => {
    try {
      await writeTx.writeTransaction(sendAsync);
    } catch (e) {
      console.log("Unexpected error in writeTx", e);
    }
  };
  // highlight-end

  return (
    // highlight-start
    <button className="btn btn-primary" onClick={handleSetGreeting}>
      Send
    </button>
    // highlight-end
  );
};
```

#### Step 5: Bonus adding loading state

We can use `isPending` returned from `useSendTransaction` while the transaction is being processed and also `disable` the button.

```tsx
import * as React from "react";
import { useSendTransaction } from "@starknet-react/core";
import { useTransactor } from "~~/hooks/scaffold-stark";

export const ContractInteraction = () => {
  // highlight-start
  const { sendAsync, isPending } = useSendTransaction({
    // highlight-end
    calls: [
      {
        contractAddress: "0x034aA3F359A9D614239015126635CE7732c18fDF3",
        entrypoint: "set_greeting",
        calldata: ["0x48656c6c6f20576f726c6421"],
      },
    ],
  });

  const writeTx = useTransactor();

  const handleSetGreeting = async () => {
    try {
      await writeTx.writeTransaction(sendAsync);
    } catch (e) {
      console.log("Unexpected error in writeTx", e);
    }
  };

  return (
    // highlight-start
    <button
      className="btn btn-primary"
      onClick={handleSetGreeting}
      disabled={isPending}
    >
      {isPending ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        "Send"
      )}
    </button>
    // highlight-end
  );
};
```

### WriteToContractWriteAsyncButton

Source: https://www.scaffoldstark.com/docs/recipes/WriteToContractWriteAsyncButton

#### Write to a Contract with `sendAsync` button

This recipe shows how to implement a button that allows users to interact with a smart contract by executing the `sendAsync` function returned by [useScaffoldWriteContract](/hooks/useScaffoldWriteContract). By following this guide, you can create a user interface for writing data to a contract.

<details open>
<summary>Here is the full code, which we will be implementing in the guide below:</summary>

```tsx title="components/Greetings.tsx"
import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark";

export const Greetings = () => {
  const [newGreeting, setNewGreeting] = useState("");

  const { sendAsync, isPending } = useScaffoldWriteContract({
    contractName: "YourContract",
    functionName: "set_greeting",
    args: [newGreeting],
  });

  const handleSetGreeting = async () => {
    try {
      await sendAsync();
    } catch (e) {
      console.error("Error setting greeting", e);
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder="Write your greeting"
        className="input border border-primary"
        onChange={(e) => setNewGreeting(e.target.value)}
      />
      <button
        className="btn btn-primary"
        onClick={handleSetGreeting}
        disabled={isPending}
      >
        {isPending ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          "Send"
        )}
      </button>
    </>
  );
};
```

</details>

#### Implementation

#### Step 1: Set Up Your Component

Create a new component in the "components" folder. This component will enable users to write data to a smart contract.

```tsx title="components/Greetings.tsx"
export const Greetings = () => {
  return (
    <>
      <input
        type="text"
        placeholder="Write your greeting"
        className="input border border-primary"
      />
      <button>Send</button>
    </>
  );
};
```

#### Step 2: Initialize `useScaffoldWriteContract` hook

Initialize the `useScaffoldWriteContract` hook. This hook provides the `sendAsync` function for sending transactions, we'll create `handleSetGreeting` function in which we'll call `sendAsync` required to perform contract interaction.

```tsx
// highlight-start
import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark";
// highlight-end

export const Greetings = () => {
  // highlight-start
  const [newGreeting, setNewGreeting] = useState("");
  // highlight-end

  // highlight-start
  const { sendAsync } = useScaffoldWriteContract({
    contractName: "YourContract",
    functionName: "set_greeting",
    args: [newGreeting],
  });
  // highlight-end

  // highlight-start
  const handleSetGreeting = async () => {
    try {
      await sendAsync();
    } catch (e) {
      console.error("Error setting greeting", e);
    }
  };
  // highlight-end

  return (
    <>
      <input
        type="text"
        placeholder="Write your greeting"
        className="input border border-primary"
      />
      <button>Send</button>
    </>
  );
};
```

#### Step 3: Add input change logic and send transaction when users click the button

Wire up the input field to update the `newGreeting` state when the user types in a new greeting and call `handleSetGreeting` function when user click on the button.

```tsx
import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark";

export const Greetings = () => {
  const [newGreeting, setNewGreeting] = useState("");

  const { sendAsync } = useScaffoldWriteContract({
    contractName: "YourContract",
    functionName: "set_greeting",
    args: [newGreeting],
  });

  const handleSetGreeting = async () => {
    try {
      await sendAsync();
    } catch (e) {
      console.error("Error setting greeting", e);
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder="Write your greeting"
        className="input border border-primary"
        // highlight-start
        onChange={(e) => setNewGreeting(e.target.value)}
        // highlight-end
      />
      <button
        className="btn btn-primary"
        // highlight-start
        onClick={handleSetGreeting}
        // highlight-end
      >
        Send
      </button>
    </>
  );
};
```

#### Step 4: Bonus adding loading state

We can use `isPending` returned from `useScaffoldWriteContract` while the transaction is being processed and also disable the button.

```tsx
import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark";

export const Greetings = () => {
  const [newGreeting, setNewGreeting] = useState("");
  // highlight-start
  const { sendAsync, isPending } = useScaffoldWriteContract({
    contractName: "YourContract",
    functionName: "set_greeting",
    args: [newGreeting],
  });
  // highlight-end

  const handleSetGreeting = async () => {
    try {
      await sendAsync();
    } catch (e) {
      console.error("Error setting greeting", e);
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder="Write your greeting"
        className="input border border-primary"
        onChange={(e) => setNewGreeting(e.target.value)}
      />

      <button
        className="btn btn-primary"
        onClick={handleSetGreeting}
        // highlight-start
        disabled={isPending}
      >
        {isPending ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          "Send"
        )}
      </button>
    </>
    // highlight-end
  );
};
```
