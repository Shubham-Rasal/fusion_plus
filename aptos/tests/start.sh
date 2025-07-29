#!/bin/bash

# Start Anvil fork for Binance Smart Chain
ANVIL_PORT=8546
BSC_RPC_URL="https://bsc-dataseed.binance.org/"

echo "Starting Anvil fork for Binance Smart Chain on port $ANVIL_PORT..."

anvil --fork-url $BSC_RPC_URL --port $ANVIL_PORT --chain-id 56 --block-time 3 --mnemonic "test test test test test test test test test test test junk" &

echo "Anvil fork for Binance Smart Chain is running."
echo "You can connect to it using the RPC URL: http://localhost:$ANVIL_PORT"