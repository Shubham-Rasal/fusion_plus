// index.ts
import {
  getFullnodeUrl,
  GetOwnedObjectsParams,
  SuiClient,
} from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import * as dotenv from "dotenv";

dotenv.config();

const env = "testnet"; //Change to depend on env var later
const rpcUrl = getFullnodeUrl(env);
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

export async function getOwnedObjects(address: string) {
  return await client.getOwnedObjects({
    owner: address,
  } as GetOwnedObjectsParams);
}

export async function getAllBalances(address: string) {
  return await client.getAllBalances({
    owner: address,
  });
}

export async function getAllCoins(address: string) {
  return await client.getAllCoins({
    owner: address,
  });
}

function txSetup(address: string, mnemonic: string) {
  const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  const tx = new Transaction();
  tx.setGasBudget(100000000);
  tx.setSender(address);
  return { keypair, tx };
}

async function txExecute(keypair: Ed25519Keypair, tx: Transaction) {
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  await client.waitForTransaction({ digest: result.digest });

  console.log("Transaction Result:", result);

  const events = result.events;
  if (events) {
    for (const event of events) {
      console.log("Event:", event);
    }
  } else {
    console.log("No events found in transaction effects.");
  }
}

export async function createBalance(address: string, mnemonic: string) {
  const { keypair: keypair, tx: tx } = txSetup(address, mnemonic);

  tx.moveCall({
    target: `${process.env.PACKAGE_PUBLISH_ADDRESS}::basic_token::create_balance`,
    arguments: [],
  });

  await txExecute(keypair, tx);
}

export async function createCustomEscrow(
  resolver_address: string,
  resolver_mnemonic: string,
  client_address: string,
  custom_key: string
) {
  /*
    Make the address for Alice and Bob and then you can test it out.
    Alice is the one who wants to make the trade, and Bob is the resolver
    When this function gets called, it's assumed that an escrow account has already been created on the primary EVM chain
    */
  //Make the object that you want to lock (Balance object), and also check if it exists beforehand
  //Keep a timelock, just as a dummy
  //Check if an escrow account already exists for the address
  //Create the escrow account
  //Check for the event?

  const { keypair: keypair, tx: tx } = txSetup(
    resolver_address,
    resolver_mnemonic
  );

  const depositor_id = tx.pure("address", resolver_address);
  const recipient_id = tx.pure("address", client_address);
  const value = tx.pure.u64(100); // This is a dummy value for now
  const custom_key_pure = tx.pure("string", custom_key);
  const timelock = tx.pure.u64(0); // This is a dummy value for now

  tx.moveCall({
    target: `${process.env.PACKAGE_PUBLISH_ADDRESS}::escrow::create_escrow_for_balance`,
    arguments: [depositor_id, recipient_id, value, custom_key_pure, timelock],
  });

  await txExecute(keypair, tx);
}

export async function createEscrowForCoin(
  resolver_address: string,
  resolver_mnemonic: string,
  client_address: string
) {
  /*
    Make the address for Alice and Bob and then you can test it out.
    Alice is the one who wants to make the trade, and Bob is the resolver
    When this function gets called, it's assumed that an escrow account has already been created on the primary EVM chain
    */
  const { keypair: keypair, tx: tx } = txSetup(
    resolver_address,
    resolver_mnemonic
  );

  const [coin] = tx.splitCoins(tx.gas, [100]);
  // tx.transferObjects([coin], tx.pure.address(resolver_address));

  tx.moveCall({
    target: `${process.env.PACKAGE_PUBLISH_ADDRESS}::escrow::create_escrow_for_coin`,
    arguments: [
      tx.pure.address(resolver_address),
      tx.pure.address(client_address),
      tx.pure.u64(100),
      tx.object(coin),
    ],
    typeArguments: ["0x2::sui::SUI"], // Assuming you want to test with SUI coin
  });

  await txExecute(keypair, tx);
}


export async function createCoinEscrow(
  resolver_address: string,
  resolver_mnemonic: string,
  client_address: string,
  hashed_string: string,
  timelock: bigint
) {
  const { keypair: keypair, tx: tx } = txSetup(
    resolver_address,
    resolver_mnemonic
  );

  const [coin] = tx.splitCoins(tx.gas, [100]);

  // depositor_id: address,
  // recipient_id: address,
  // hashed_string: string::String,
  // timelock: u64,
  // obj: Coin<T>,
  // ctx:&mut TxContext
  tx.moveCall({
    target: `${process.env.PACKAGE_PUBLISH_ADDRESS}::escrow::create_coin_escrow`,
    typeArguments: ["0x2::sui::SUI"],
    arguments: [
      tx.pure.address(resolver_address),
      tx.pure.address(client_address),
      tx.pure.u64(1000),
      tx.object(coin),
    ],
  });

  await txExecute(keypair, tx);
}

export async function createEscrow(
  resolver_address: string,
  resolver_mnemonic: string,
  client_address: string
) {
  /*
    Make the address for Alice and Bob and then you can test it out.
    Alice is the one who wants to make the trade, and Bob is the resolver
    When this function gets called, it's assumed that an escrow account has already been created on the primary EVM chain
    */
  //Make the object that you want to lock (Balance object), and also check if it exists beforehand
  //Keep a timelock, just as a dummy
  //Check if an escrow account already exists for the address
  //Create the escrow account
  //Check for the event?

  // const { keypair: keypair, tx: tx } = txSetup(resolver_address, resolver_mnemonic);
  const keypair = Ed25519Keypair.deriveKeypair(resolver_mnemonic);
  const tx = new Transaction();
  tx.setGasBudget(100000000);
  tx.setSender(resolver_address);

  // This is the object to lock
  const [coin] = tx.splitCoins(tx.gas, [100]);

  //Create the parameters for the move call
  // const depositor_id = tx.pure('address',resolver_address);
  // const recipient_id = tx.pure('address',client_address);
  // const obj = tx.object(coin);
  // const timelock = tx.pure.u64(1000); // This is a dummy value for now

  tx.moveCall({
    target: `${process.env.PACKAGE_PUBLISH_ADDRESS}::escrow::create_escrow_for_coin`,
    typeArguments: ["0x2::sui::SUI"],
    arguments: [
      tx.pure.address(resolver_address),
      tx.pure.address(client_address),
      tx.pure.u64(10),
      tx.object(coin),
    ],
  });

  // await txExecute(keypair, tx);
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  // console.log("Transaction Result:", result);

  // Wait for the transaction to be confirmed
  await client.waitForTransaction({ digest: result.digest });

  console.log("Transaction confirmed:", result.digest);

  // // Check the events to see if the escrow was created successfully
  // const events = result.events;
  // if (events) {
  //   for (const event of events) {
  //     console.log("Event:", event);
  //   }
  // } else {
  //   console.log("No events found in transaction effects.");
  // }
}

export async function claimEscrow(resolver_address: string,
  resolver_mnemonic: string,
  client_address: string,
  escrow_id: string,
  key:string) {
  //Check for the escrow in the resolver space
  //Unlock it

  //Make a move call to the escrow 
  const { keypair: keypair, tx: tx } = txSetup(
    resolver_address,
    resolver_mnemonic
  );

  const [coin] = tx.splitCoins(tx.gas, [100]);
  // tx.transferObjects([coin], tx.pure.address(resolver_address));

  tx.moveCall({
    target: `${process.env.PACKAGE_PUBLISH_ADDRESS}::escrow::claim_escrow_for_coin`,
    arguments: [
      tx.pure.id(escrow_id),
    ],
    typeArguments: ["0x2::sui::SUI"], // Assuming you want to test with SUI coin
  });

  tx.transferObjects([coin], tx.pure.address(client_address));

  await txExecute(keypair, tx);
  //Transfer a gas coin of same value to the recipient address from the sender


}
