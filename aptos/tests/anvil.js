import "dotenv/config";
import { JsonRpcProvider, Wallet as SignerWallet, ContractFactory } from "ethers";
import { createServer } from "prool";
import { anvil } from "prool/instances";
import factoryContract from '../dist/contracts/TestEscrowFactory.sol/TestEscrowFactory.json' with  { type: 'json' };
(async () => {



const provider = new JsonRpcProvider(
  `http://127.0.0.1:8545`,
  1,
  {
    cacheTimeout: -1,
    staticNetwork: true,
  }
);

const deployer = new SignerWallet("", provider)

    // deploy EscrowFactory
    const escrowFactory = await deploy(
        factoryContract,
        [
            "0x111111125421ca6dc452d289314280a0f8842a65",
            "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // feeToken,
            "0x0000000000000000000000000000000000000000", // accessToken,
            deployer.address, // owner
            60 * 30, // src rescue delay
            60 * 30 // dst rescue delay
        ],
        provider,
        deployer
    )

  console.log(`EscrowFactory deployed at ${escrowFactory}`)
})()

async function deploy(
    json,
    params,
    provider,
    deployer
) {
    const deployed = await new ContractFactory(json.abi, json.bytecode, deployer).deploy(...params)
    await deployed.waitForDeployment()

    return await deployed.getAddress()
}