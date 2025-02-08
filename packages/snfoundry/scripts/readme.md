# about script

## how to run it

- dev

using `yarn deploy` to run. it will return this

```bash

No network specified. Running deployment on Devnet by default...
command: account import
error: Account with name = scaffold-devnet-account-1 already exists in network with chain_id = SN_SEPOLIA
/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry
warn: found duplicate packages named `addition v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `addition v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

warn: found duplicate packages named `fibonacci v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `fibonacci v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

warn: found duplicate packages named `hello_workspaces v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `hello_workspaces v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

   Compiling lib(deploy_script) deploy_script v0.1.0 (/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry/scripts/Scarb.toml)
   Compiling starknet-contract(deploy_script) deploy_script v0.1.0 (/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry/scripts/Scarb.toml)
    Finished `dev` profile target(s) in 27 seconds
warn: found duplicate packages named `addition v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `addition v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

warn: found duplicate packages named `fibonacci v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `fibonacci v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

warn: found duplicate packages named `hello_workspaces v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `hello_workspaces v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

   Compiling lib(deploy_script) deploy_script v0.1.0 (/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry/scripts/Scarb.toml)
   Compiling starknet-contract(deploy_script) deploy_script v0.1.0 (/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry/scripts/Scarb.toml)
    Finished `dev` profile target(s) in 28 seconds
Transaction hash: 0xedd4d2ff76d1de9a3110b9cf7aa020e50ff261613afd61ed62429e54c22424
declare result: class_hash: 2220056144819685874043888308841394761649577173077632235532171433250405236380, transaction_hash: 420211613070310794540196665175886258466526813601834003686575940845453845540
Transaction hash: 0x490873c5d820eac12c12e755f212fb895b12cd0fc0551a59c503218c764f191
Deployed the contract to address: contract_address: 152297156873262939265739539437283576539942821834396675633022867366606687161, transaction_hash: 2064610734862315252645720349992541243237703364262357271742237055097709588881
command: script run
status: success


```


- sepolia
using `yarn deploy --network sepolia` to run. it will return this

```bash
sepolia network specified. Running...
command: account import
error: Account with name = scaffold-sepolia-account-1 already exists in network with chain_id = SN_SEPOLIA
/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry
warn: found duplicate packages named `addition v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `addition v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

warn: found duplicate packages named `fibonacci v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `fibonacci v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

warn: found duplicate packages named `hello_workspaces v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `hello_workspaces v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

   Compiling lib(deploy_script) deploy_script v0.1.0 (/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry/scripts/Scarb.toml)
   Compiling starknet-contract(deploy_script) deploy_script v0.1.0 (/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry/scripts/Scarb.toml)
    Finished `dev` profile target(s) in 89 seconds
warn: found duplicate packages named `addition v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `addition v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

warn: found duplicate packages named `fibonacci v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `fibonacci v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

warn: found duplicate packages named `hello_workspaces v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)`

Found locations:
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a
- git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a

Because of this, referencing package `hello_workspaces v0.1.0 (git+https://github.com/foundry-rs/starknet-foundry?tag=v0.35.1#089de2c7a391372a7aaa54ec2706b117f955d06a)` will fail.

   Compiling lib(deploy_script) deploy_script v0.1.0 (/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry/scripts/Scarb.toml)
   Compiling starknet-contract(deploy_script) deploy_script v0.1.0 (/Users/zhengpeng/Source/Code/Rust-Code/Github/scaffold-stark-2/packages/snfoundry/scripts/Scarb.toml)
    Finished `dev` profile target(s) in 26 seconds
command: script run
message: 
    0x6465636c617265206661696c6564 ('declare failed')

status: script panicked


```


## current may Troubled problem

cairo script declare not support ,if declare exist then retrun class_hash.
if the declare exist at the on-chain. the script will blocking.



