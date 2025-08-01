// index.ts
import { getFullnodeUrl, GetObjectParams, GetOwnedObjectsParams, SuiClient } from '@mysten/sui/client';
import * as dotenv from "dotenv";
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { Transactions } from '@mysten/sui.js/transactions';
import { useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Signer } from '@mysten/sui.js/dist/cjs/cryptography';
import { TransferObjectsTransaction } from '@mysten/sui.js/dist/cjs/transactions';

dotenv.config();

const ADDRESS = process.env.ADDR as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

//Initialize the addresses
    // const aliceAddress = process.env.ALICE_ADDRESS_SECOND_CHAIN as string;
    // const bobAddress = process.env.BOB_ADDRESS_SECOND_CHAIN as string;
// const bobAddress = "0x0e1fd0f746dd52adf379b0fde09f74e563ebd9b199537345879c2d2718e1f77d"
const bobAddress = '0x8414573dd5040e282183ac35aae3124cbac839f14cf608a636755213c00d0602';


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

export async function createBalance() {
    // console.log("Bob address:", bobAddress);
    // const result = await client.getOwnedObjects({
    //     owner: bobAddress
    // })
    
    // console.log("Owned Objects:", result["data"]);

    // for (const object of result["data"]) {
    //     const current_object_id = object["data"]? object["data"]['objectId'] : null;
    //     if (current_object_id) {
    //         console.log("Object is ", await client.getObject({id: current_object_id}).)
    //     }
    // }

    console.log(await client.getAllBalances({
        owner: bobAddress
    }))

    console.log(await client.getAllCoins({
        owner: bobAddress
    }))

    const response = await client.getOwnedObjects({
        owner: '0x8414573dd5040e282183ac35aae3124cbac839f14cf608a636755213c00d0602'})
    console.log("Owned Objects:", response.data[0]);
    // client.executeTransactionBlock()
    
    // client.signAndExecuteTransactionBlock()

    // const { data, isPending, error, refetch } = useSuiClientQuery('getOwnedObjects', {
	// 	owner: bobAddress,
	// });

    // console.log("Data:", data);

    // console.log("Creating balance...");

    const exampleMnemonic = 'chest sudden lift impulse bamboo desk runway scatter left safe elevator case';
    
    const keypair = Ed25519Keypair.deriveKeypair(exampleMnemonic);
    const tx = new Transaction();
    tx.setGasBudget(100000000)
    tx.setSender('0x8414573dd5040e282183ac35aae3124cbac839f14cf608a636755213c00d0602');
    tx.moveCall({
        target: '0x68bedda74ef91e28b6f4cc02c4fac47f62970cfb1ff8d819876f4e9406a47a0e::sui_fusion_swap::basic_token::create_balance',
        arguments: [],
    })

    async function getTransactionBlock() {
        const result = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
        await client.waitForTransaction({ digest: result.digest });
        console.log("Transaction Result:", result);
        console.log(await getTransactionByDigest(result.digest));
}
    await getTransactionBlock()
    console.log("Balance created");
    
}

const SUI_GRAPHQL_ENDPOINT = "http://localhost:7000/graphql"; // Replace with actual endpoint

async function getTransactionByDigest(digest: string) {
  const query = `
    query GetTransaction($digest: String!) {
      transactionBlock(digest: $digest) {
        sender { address }
        gasInput {
          gasSponsor { address }
          gasPayment { nodes { address } }
          gasPrice
          gasBudget
        }
        kind { __typename }
        signatures
        digest
        expiration { epochId }
        effects { timestamp }
      }
    }
  `;

  const response = await fetch(SUI_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { digest }
    }),
  });

  if (!response.ok) {
    throw new Error(`Network error: ${response.statusText}`);
  }

  const { data, errors } = await response.json();
  if (errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(errors)}`);
  }

  return data.transactionBlock;
}

// Example usage:
getTransactionByDigest("HvTjk3ELg8gRofmB1GgrpLHBFeA53QKmUKGEuhuypezg")
  .then(console.log)
  .catch(console.error);


async function createEscrow() {
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
}

async function claimEscrow() {}

createBalance();