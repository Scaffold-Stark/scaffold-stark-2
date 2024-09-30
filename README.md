# 🚩 Challenge {challengeNum}: {challengeEmoji} {challengeTitle}

{challengeHeroImage}

A {challengeDescription}.

🌟 The final deliverable is an app that {challengeDeliverable}.
Deploy your contracts to a testnet then build and upload your app to a public web server. Submit the url on [SpeedRunStark.com](https://speedrunstark.com/)!

💬 Meet other builders working on this challenge and get help in the {challengeTelegramLink}

---

## Checkpoint 0: 📦 Environment 📚

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)
- [Rust](https://www.rust-lang.org/tools/install)
- [asdf](https://asdf-vm.com/guide/getting-started.html)
- [Cairo 1.0 extension for VSCode](https://marketplace.visualstudio.com/items?itemName=starkware.cairo1)

### Starknet-devnet version

To ensure the proper functioning of scaffold-stark, your local `starknet-devnet` version must be `0.2.0`. To accomplish this, first check your local starknet-devnet version:

```sh
starknet-devnet --version
```

If your local starknet-devnet version is not `0.2.0`, you need to install it.

- Install Starknet-devnet `0.2.0` via `asdf` ([instructions](https://github.com/gianalarcon/asdf-starknet-devnet/blob/main/README.md)).

### Compatible versions

- Starknet-devnet - v0.2.0
- Scarb - v2.8.2
- Snforge - v0.30.0
- Cairo - v2.8.2
- RPC - v0.7.1

Make sure you have the compatible versions otherwise refer to [Scaffold-Stark Requirements](https://github.com/Scaffold-Stark/scaffold-stark-2?.tab=readme-ov-file#requirements)

Then download the challenge to your computer and install dependencies by running:

```sh
git clone https://github.com/Scaffold-Stark/speedrunstark.git {challengeName}
cd {challengeName}
git checkout {challengeName}
yarn install
```

> in the same terminal, start your local network (a local instance of a blockchain):

```sh
yarn chain
```

> To run a fork : `yarn chain --fork-network <URL> [--fork-block <BLOCK_NUMBER>]`

> in a second terminal window, 🛰 deploy your contract (locally):

```sh
cd <challenge_folder_name>
yarn deploy
```

> in a third terminal window, start your 📱 frontend:

```sh
cd <challenge_folder_name>
yarn start
```

📱 Open <http://localhost:3000> to see the app.

> 👩‍💻 Rerun `yarn deploy --reset` whenever you want to deploy new contracts to the frontend, update your current contracts with changes, or re-deploy it to get a fresh contract address.

🔏 Now you are ready to edit your smart contract `{YourCollectible.cairo}` in `packages/snfoundry/contracts`

---

### ⚔️ Side Quests

_To finish your README, can add these links_

> 🏃 Head to your next challenge [here](https://speedrunstark.com/).

> 💬 Problems, questions, comments on the stack? Post them to the [🏗 Scaffold-Stark developers chat](https://t.me/+wO3PtlRAreo4MDI9)
