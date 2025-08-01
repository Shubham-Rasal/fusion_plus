# fusion+ protocol

1inch fusion+ protocol implementation for non-EVM chains

Target chains

- SUI
- APTOS
- ICP
- TON

## Aptos

Note: compile the contract again after testing for deployment


<!-- [
      109, 121,  95, 115, 101,  99, 114,
      101, 116,  95, 112,  97, 115, 115,
      119, 111, 114, 100,  95, 102, 111,
      114,  95, 115, 119,  97, 112,  95,
      116, 101, 115, 116
    ] -->


<!-- [
      109, 121,  95, 115, 101,  99, 114,
      101, 116,  95, 112,  97, 115, 115,
      119, 111, 114, 100,  95, 102, 111,
      114,  95, 115, 119,  97, 112,  95,
      116, 101, 115, 116
    ] -->

## Sui

### Setup

- For local testing, setup a sui node with `RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis`
- Also run `npm i ts-node @mysten/sui dotenv`, for testing purposes
- https://dev.to/goodylili/how-to-use-the-sui-typescript-sdk-2dep - Reference for local Sui node setup, with TS SDK

### Implementation
First on the EVM chain you have Alice making an escrow account, and putting the token in chain A and locking it
-> Not done by SUI 

Then Bob creates an escrow account on chain B and locks the token in chain B there
-> This will be done by the createEscrow function, and this resolver will manage that

After that Alice can claim the token on chain B and Bob can claim the token on chain A
-> After the escrow account is created, the resolver does the claiming on behalf of Alice