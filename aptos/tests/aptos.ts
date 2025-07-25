import { AptosAccount, AptosClient, Types } from "aptos";
import * as dotenv from "dotenv";

dotenv.config();

const NODE = "https://fullnode.mainnet.aptoslabs.com/v1";
const account = AptosAccount.fromAptosAccountObject({
  privateKeyHex: process.env.PRIVKEY as string,
  address: process.env.ADDR as string,
});

// Create a second test account for transfer testing
const testAccount = new AptosAccount();

const client = new AptosClient(NODE);

async function testInitializeToken() {
  const payload = {
    type: "entry_function_payload",
    function: `${process.env.ADDR}::fusion_token::initialize`,
    type_arguments: [],
    arguments: ["Fusion Token", "FUSION", 8, true],
  };
  await signAndSubmit(payload);
  console.log("✓ Token initialized successfully");
}

async function testRegisterAccount(account: AptosAccount) {
  const payload = {
    type: "entry_function_payload",
    function: `${process.env.ADDR}::fusion_token::register`,
    type_arguments: [],
    arguments: [],
  };
  await signAndSubmit(payload);
  console.log(`✓ Account ${account.address()} registered successfully`);
}

async function testMint(to: string, amount: number) {
  const payload = {
    type: "entry_function_payload",
    function: `${process.env.ADDR}::fusion_token::mint`,
    type_arguments: [],
    arguments: [to, amount.toString()],
  };
  await signAndSubmit(payload);
  console.log(`✓ Minted ${amount} tokens to ${to}`);
}

async function testTransfer(to: string, amount: number) {
  const payload = {
    type: "entry_function_payload",
    function: `${process.env.ADDR}::fusion_token::transfer`,
    type_arguments: [],
    arguments: [to, amount.toString()],
  };
  await signAndSubmit(payload);
  console.log(`✓ Transferred ${amount} tokens to ${to}`);
}

async function testBurn(amount: number) {
  const payload = {
    type: "entry_function_payload",
    function: `${process.env.ADDR}::fusion_token::burn`,
    type_arguments: [],
    arguments: [amount.toString()],
  };
  await signAndSubmit(payload);
  console.log(`✓ Burned ${amount} tokens`);
}

async function getBalance(address: string): Promise<number> {
  try {
    const resource = await client.getAccountResource(
      address,
      `${process.env.ADDR}::fusion_token::FusionToken`
    );
    return parseInt((resource.data as any).value);
  } catch (e) {
    console.error("Error getting balance:", e);
    return 0;
  }
}

async function signAndSubmit(payload: any) {
  try {
    const rawTxn = await client.generateTransaction(account.address(), payload);
    const bcsTxn = AptosClient.generateBCSTransaction(account, rawTxn);
    const pending = await client.submitSignedBCSTransaction(bcsTxn);
    await client.waitForTransaction(pending.hash);
    console.log("Transaction successful:", `https://explorer.aptoslabs.com/txn/${pending.hash}?network=mainnet`);
  } catch (e) {
    console.error("Transaction failed:", e);
    throw e;
  }
}

async function runTests() {
  try {
    console.log("Starting Fusion Token tests...");
    
    // Initialize the token
    // await testInitializeToken();
    
    // Register accounts
    // await testRegisterAccount(account);
    // await testRegisterAccount(testAccount);
    
    // Test mint
    // const mintAmount = 1000;
    // await testMint(account.address().toString(), mintAmount);
    
    // Check balance after mint
    const balance = await getBalance(account.address().toString());
    console.log(`Balance after mint: ${balance}`);
    
    // Test transfer
    // const transferAmount = 100;
    // await testTransfer(testAccount.address().toString(), transferAmount);
    
    // // Check balances after transfer
    // const senderBalance = await getBalance(account.address().toString());
    // const receiverBalance = await getBalance(testAccount.address().toString());
    // console.log(`Sender balance after transfer: ${senderBalance}`);
    // console.log(`Receiver balance after transfer: ${receiverBalance}`);
    
    // // Test burn
    // const burnAmount = 50;
    // await testBurn(burnAmount);
    
    // // Final balance check
    // const finalBalance = await getBalance(account.address().toString());
    // console.log(`Final balance: ${finalBalance}`);
    
    console.log("All tests completed successfully!");
  } catch (e) {
    console.error("Test suite failed:", e);
  }
}

runTests();
