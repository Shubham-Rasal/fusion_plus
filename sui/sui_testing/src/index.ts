// index.ts
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import * as dotenv from "dotenv";

dotenv.config();

const ADDRESS = process.env.ADDR as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const rpcUrl = getFullnodeUrl("localnet");

const client = new SuiClient({ url: rpcUrl });

async function getNetworkStatus() {
    const currentEpoch = await client.getLatestSuiSystemState();
    console.log(currentEpoch)
}

getNetworkStatus();
