# fusion+ protocol
1inch fusion+ protocol implementation for non-EVM chains

Target chains

- SUI
- APTOS
- ICP
- TON

## Aptos

Note: compile the contract again after testing for deployment

## Sui

- For local testing, setup a sui node with `RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis`
- Also run `npm i ts-node @mysten/sui dotenv`, for testing purposes
- https://dev.to/goodylili/how-to-use-the-sui-typescript-sdk-2dep - Reference for local Sui node setup, with TS SDK