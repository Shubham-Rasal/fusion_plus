// index.ts
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { createBalance, createEscrow } from "./interaction";
import * as dotenv from "dotenv";

//Use sui scan to verify - https://suiscan.xyz/testnet/tx/HsNVqMtEGAnzEsXHW4Jf1MXFca2XsyXQLGfm4aBP7M2F
//Use the graphQL for the interface - https://sui-testnet.mystenlabs.com/graphql

dotenv.config();

const bobAddress = process.env.TESTNET_ADDRESS_1 as string;
const bobMnemonic = process.env.TESTNET_MNEMONIC_1 as string;
const aliceAddress = process.env.TESTNET_ADDRESS_2 as string;
const aliceMnemonic = process.env.TESTNET_MNEMONIC_2 as string;

// createBalance(bobAddress, bobMnemonic);
createEscrow(bobAddress, bobMnemonic, aliceAddress);
