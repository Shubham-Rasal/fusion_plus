import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
const tx = new Transaction();

// create a new coin with balance 100, based on the coins used as gas payment
// you can define any balance here
const [coin] = tx.splitCoins(tx.gas, [100]);

// transfer the split coin to a specific address
tx.transferObjects([coin], '0x0e1fd0f746dd52adf379b0fde09f74e563ebd9b199537345879c2d2718e1f77d');
import { getFullnodeUrl, GetObjectParams, GetOwnedObjectsParams, SuiClient } from '@mysten/sui/client';

const exampleMnemonic = 'chest sudden lift impulse bamboo desk runway scatter left safe elevator case';

const keyPair = Ed25519Keypair.deriveKeypair(exampleMnemonic);
const rpcUrl = getFullnodeUrl("localnet");

const client = new SuiClient({ url: rpcUrl });

async function getTransactionBlock() {
const result = await client.signAndExecuteTransaction({ signer: keyPair, transaction: tx });
await client.waitForTransaction({ digest: result.digest });
}

getTransactionBlock()