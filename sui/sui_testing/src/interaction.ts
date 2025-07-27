// index.ts
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import * as dotenv from "dotenv";

dotenv.config();

const ADDRESS = process.env.ADDR as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const rpcUrl = getFullnodeUrl("localnet");

const client = new SuiClient({ url: rpcUrl });

/*
This test works like this

First on the EVM chain you have Alice making an escrow account, and putting the token in chain A and locking it
-> Not done by us

Then Bob creates an escrow account on chain B and locks the token in chain B there
-> This will be done by the createEscrow function, and this resolver will manage that

After that Alice can claim the token on chain B and Bob can claim the token on chain A
-> After the escrow account is created, the resolver does the claiming on behalf of Alice
*/

async function createEscrow() {
    //Make the address for Alice and Bob and then you can test it out
}

async function claimEscrow() {}