// index.ts
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import {
  createBalance,
  createCustomEscrow,
  createEscrow,
  createCoinEscrow,
  createEscrowForCoin,
  claimEscrow,
} from "./interaction";
import * as dotenv from "dotenv";

//Use sui scan to verify - https://suiscan.xyz/testnet/home
//Use the graphQL for the interface - https://sui-testnet.mystenlabs.com/graphql

dotenv.config();

const bobAddress = process.env.TESTNET_ADDRESS_1 as string;
const bobMnemonic = process.env.TESTNET_MNEMONIC_1 as string;
const aliceAddress = process.env.TESTNET_ADDRESS_2 as string;
const aliceMnemonic = process.env.TESTNET_MNEMONIC_2 as string;

//Call interaction functions here for testing
