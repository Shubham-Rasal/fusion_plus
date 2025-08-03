import "dotenv/config";
import { jest } from "@jest/globals";
initChain;
import { createServer, CreateServerReturnType } from "prool";

import Sdk from "@1inch/cross-chain-sdk";
import {
  computeAddress,
  ContractFactory,
  ethers,
  JsonRpcProvider,
  MaxUint256,
  parseEther,
  parseUnits,
  randomBytes,
  Wallet as SignerWallet,
} from "ethers";
import { uint8ArrayToHex, UINT_40_MAX } from "@1inch/byte-utils";
import { ChainConfig, config } from "./config";
import { Wallet } from "./wallet";
import { Resolver } from "./resolver";
import { EscrowFactory } from "./escrow-factory";
import factoryContract from "../../eth/dist/contracts/TestEscrowFactory.sol/TestEscrowFactory.json";
import resolverContract from "../../eth/dist/contracts/Resolver.sol/Resolver.json";
import * as aptos from "./aptos";

export const { Address } = Sdk;

jest.setTimeout(1000 * 60);

const userPk =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const resolverPk =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

// eslint-disable-next-line max-lines-per-function
describe("Resolving example", () => {
  const srcChainId = config.chain.source.chainId;
  const dstChainId = config.chain.aptos.chainId;

  type Chain = {
    node?: CreateServerReturnType | undefined;
    provider: JsonRpcProvider;
    escrowFactory: string;
    resolver: string;
  };

  let src: Chain;
  let dst: Chain;

  let srcChainUser: Wallet;
  let dstChainUser: Wallet;
  let srcChainResolver: Wallet;
  let dstChainResolver: Wallet;

  let srcFactory: EscrowFactory;
  let dstFactory: EscrowFactory;
  let srcResolverContract: Wallet;
  let dstResolverContract: Wallet;

  let srcTimestamp: bigint;

  async function increaseTime(t: number): Promise<void> {
    await Promise.all(
      [src, dst].map((chain) => chain.provider.send("evm_increaseTime", [t]))
    );
  }


  afterAll(async () => {
    src.provider.destroy();
    // dst.provider.destroy();
  });

  //eslint-disable-next-line max-lines-per-function
  describe("Fill", () => {
    it.each([2])(
      "should swap Base USDC -> Aptos MYTOKEN. Single fill only (run %d)",
      async (runNumber) => {
        src = await initChain(config.chain.source);
        dst = await initChain(config.chain.destination);

        //initialise aptos side of ledger
        await aptos.initialize_swap_ledger();

        srcChainUser = new Wallet(userPk, src.provider);
        dstChainUser = new Wallet(userPk, dst.provider);
        srcChainResolver = new Wallet(resolverPk, src.provider);
        dstChainResolver = new Wallet(resolverPk, dst.provider);

        srcFactory = new EscrowFactory(src.provider, src.escrowFactory);
        dstFactory = new EscrowFactory(dst.provider, dst.escrowFactory);
        5
        // get 1000 USDC for user in SRC chain and approve to LOP
        await srcChainUser.topUpFromDonor(
          config.chain.source.tokens.USDC.address,
          config.chain.source.tokens.USDC.donor,
          parseUnits("1000", 6)
        );
        await srcChainUser.approveToken(
          config.chain.source.tokens.USDC.address,
          config.chain.source.limitOrderProtocol,
          MaxUint256
        );

        console.log("got the tokens approved for LOP");

        // get 2000 USDC for resolver in DST chai5n
        srcResolverContract = await Wallet.fromAddress(
          src.resolver,
          src.provider
        );
        dstResolverContract = await Wallet.fromAddress(
          dst.resolver,
          dst.provider
        );
        await dstResolverContract.topUpFromDonor(
          config.chain.destination.tokens.USDC.address,
          config.chain.destination.tokens.USDC.donor,
          parseUnits("2000", 6)
        );
        // top up contract for approve
        await dstChainResolver.transfer(dst.resolver, parseEther("1"));
        await dstResolverContract.unlimitedApprove(
          config.chain.destination.tokens.USDC.address,
          dst.escrowFactory
        );

        srcTimestamp = BigInt(
          (await src.provider.getBlock("latest"))!.timestamp
        );

        const balances = await getBalances(config.chain.source.tokens.USDC.address, config.chain.destination.tokens.USDC.address)
        console.log(balances);
        // Construct order by hand
        const secretBytes = ethers.toUtf8Bytes(
          "my_secret_password_for_swap_test"
        );
        const secret = uint8ArrayToHex(secretBytes); // note: use crypto secure random number in real world
        const order = Sdk.CrossChainOrder.new(
          new Address(src.escrowFactory),
          {
            salt: Sdk.randBigInt(1000n),
            maker: new Address(await srcChainUser.getAddress()),
            makingAmount: parseUnits("1", 6),
            takingAmount: parseUnits("1", 6),
            makerAsset: new Address(config.chain.source.tokens.USDC.address),
            takerAsset: new Address(
              config.chain.destination.tokens.USDC.address
            ), // dummy field, need support for aptos
          },
          {
            hashLock: Sdk.HashLock.forSingleFill(secret),
            timeLocks: Sdk.TimeLocks.new({
              srcWithdrawal: 10n, // 10sec finality lock for test
              srcPublicWithdrawal: 120n, // 2m for private withdrawal
              srcCancellation: 121n, // 1sec public withdrawal
              srcPublicCancellation: 122n, // 1sec private cancellation
              dstWithdrawal: 10n, // 10sec finality lock for test
              dstPublicWithdrawal: 100n, // 100sec private withdrawal
              dstCancellation: 101n, // 1sec public withdrawal
            }),
            srcChainId: Sdk.NetworkEnum.ETHEREUM,
            dstChainId: Sdk.NetworkEnum.BINANCE, // temporary, should add aptos to supported chains
            srcSafetyDeposit: parseEther("0.001"),
            dstSafetyDeposit: parseEther("0.001"),
          },
          {
            auction: new Sdk.AuctionDetails({
              initialRateBump: 0,
              points: [],
              duration: 120n,
              startTime: srcTimestamp,
            }),
            whitelist: [
              {
                address: new Address(src.resolver),
                allowFrom: 0n,
              },
            ],
            resolvingStartTime: 0n,
          },
          {
            nonce: Sdk.randBigInt(UINT_40_MAX),
            allowPartialFills: false,
            allowMultipleFills: false,
          }
        );
        // user signs order on src chain, sends it to relayer / resolver
        const signature = await srcChainUser.signOrder(srcChainId, order);
        const orderHash = order.getOrderHash(srcChainId);
        // resolver deploys escrow on src chain with order
        const resolverContract = new Resolver(src.resolver, dst.resolver);
        console.log(`[${srcChainId}]`, `Filling order ${orderHash}`);
        const fillAmount = order.makingAmount;
        const { txHash: orderFillHash, blockHash: srcDeployBlock } =
          await srcChainResolver.send(
            resolverContract.deploySrc(
              srcChainId,
              order,
              signature,
              Sdk.TakerTraits.default()
                .setExtension(order.extension)
                .setAmountMode(Sdk.AmountMode.maker)
                .setAmountThreshold(order.takingAmount),
              fillAmount
            )
          );
        console.log(
          `[${srcChainId}]`,
          `Order ${orderHash} filled for ${fillAmount} in tx https://base.blockscout.com/tx/${orderFillHash}`
        );
        const srcEscrowEvent =
          await srcFactory.getSrcDeployEvent(srcDeployBlock);

        console.log(srcEscrowEvent)

        // continue on aptos, deposit cash to escrow on dst chain
        const dstImmutables = srcEscrowEvent[0]
          .withComplement(srcEscrowEvent[1])
          .withTaker(new Address(resolverContract.dstAddress));

        console.log(
          `[${dstChainId}]`,
          `Depositing ${dstImmutables.amount} for order ${orderHash}`
        );

        // FUND ESCROW ON APTOS
        await aptos.fund_dst_escrow();
    

        const ESCROW_SRC_IMPLEMENTATION = await srcFactory.getSourceImpl();
        const ESCROW_DST_IMPLEMENTATION = "ESCROW_DST_IMPLEMENTATION";

        const srcEscrowAddress = new Sdk.EscrowFactory(
          new Address(src.escrowFactory)
        ).getSrcEscrowAddress(srcEscrowEvent[0], ESCROW_SRC_IMPLEMENTATION);

        //relayer is watching for the event on destination chain for funding escrow
        // relayer signals it's safe to share secret

        // user shares secret with relayer -> resolver unlocks funds on dst chain

        await increaseTime(11);
        // unlock funds on dst chain for user

        await aptos.claim_funds(27); // unhardcode params

        // withdraw funds from src chain for resolver
        console.log(
          `[${srcChainId}]`,
          `Withdrawing funds for resolver from ${srcEscrowAddress}`
        );

        const { txHash: resolverWithdrawHash } = await srcChainResolver.send(
          resolverContract.withdraw(
            "src",
            srcEscrowAddress,
            secret,
            srcEscrowEvent[0]
          )
        );
        console.log(
          `[${srcChainId}]`,
          `Withdrew funds for resolver from ${srcEscrowAddress} to ${src.resolver} in tx https://base.blockscout.com/tx/${resolverWithdrawHash}`
        );

        const finalBalances = await getBalances(config.chain.source.tokens.USDC.address, config.chain.destination.tokens.USDC.address);
        console.log("Final balances:", finalBalances);
        
        // Format balances for human readability
        const formatBalance = (balance: bigint) => {
          return (Number(balance) / 1_000_000).toFixed(6); // USDC has 6 decimals
        };
        
        console.log("=== FINAL BALANCES (USDC) ===");
        console.log(`Source Chain (Base):`);
        console.log(`  User: ${formatBalance(finalBalances.src.user)} USDC`);
        console.log(`  Resolver: ${formatBalance(finalBalances.src.resolver)} USDC`);
        console.log(`Destination Chain (Aptos):`);
        console.log(`  User: ${formatBalance(finalBalances.dst.user)} USDC`);
        console.log(`  Resolver: ${formatBalance(finalBalances.dst.resolver)} USDC`);
        console.log("================================");
      
      }
    );

    async function getBalances(
        srcToken: string,
        dstToken: string
    ): Promise<{src: {user: bigint; resolver: bigint}; dst: {user: bigint; resolver: bigint}}> {
        return {
            src: {
                user: await srcChainUser.tokenBalance(srcToken),
                resolver: await srcResolverContract.tokenBalance(srcToken)
            },
            dst: {
                user: await dstChainUser.tokenBalance(dstToken),
                resolver: await dstResolverContract.tokenBalance(dstToken)
            }
        }
    }

  });
});



async function initChain(cnf: ChainConfig): Promise<{
  provider: JsonRpcProvider;
  escrowFactory: string;
  resolver: string;
}> {
  const { provider } = await getProvider(cnf);
  //   console.log(Address.fromBigInt(0n).toString());
  const deployer = new SignerWallet(cnf.ownerPrivateKey, provider);
  console.log(`[${cnf.chainId}]`, `Deployer address:`, deployer.address);

  // deploy EscrowFactory
  const escrowFactory = await deploy(
    factoryContract,
    [
      cnf.limitOrderProtocol,
      cnf.wrappedNative, // feeToken,
      Address.fromBigInt(0n).toString(), // accessToken,
      deployer.address, // owner
      60 * 30, // src rescue delay
      60 * 30, // dst rescue delay
    ],
    provider,
    deployer
  );
  console.log(
    `[${cnf.chainId}]`,
    `Escrow factory contract deployed to`,
    escrowFactory
  );

  // deploy Resolver contract
  try {
    const resolver = await deploy(
      resolverContract,
      [
        escrowFactory,
        cnf.limitOrderProtocol,
        computeAddress(
          "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        ), // resolver as owner of contract
      ],
      provider,
      deployer
    );
    console.log(`[${cnf.chainId}]`, `Resolver contract deployed to`, resolver);

    return { provider, resolver, escrowFactory };
  } catch (error: any) {
    console.error(
      `[${cnf.chainId}]`,
      `Error deploying resolver contract:`,
      error
    );
    if (error.message) {
      console.error(`[${cnf.chainId}]`, `Error message:`, error.message);
    }
    if (error.stack) {
      console.error(`[${cnf.chainId}]`, `Stack trace:`, error.stack);
    }
    throw error; // re-throw the error so that the program exits and we know there was an issue
  }
}

async function getProvider(
  cnf: ChainConfig
): Promise<{ node?: CreateServerReturnType; provider: JsonRpcProvider }> {
  if (!cnf.createFork) {
    return {
      provider: new JsonRpcProvider(cnf.url, cnf.chainId, {
        cacheTimeout: -1,
        staticNetwork: true,
      }),
    };
  }

  const provider = new JsonRpcProvider(cnf.rpcUrl, 1, {
    cacheTimeout: -1,
    staticNetwork: true,
  });

  console.log(provider);

  return {
    provider,
  };
}

/**
 * Deploy contract and return its address
 */
async function deploy(
  json: { abi: any; bytecode: any },
  params: unknown[],
  provider: JsonRpcProvider,
  deployer: SignerWallet
): Promise<string> {
  const nonce = await provider.getTransactionCount(deployer.address);
  const deployed = await new ContractFactory(
    json.abi,
    json.bytecode,
    deployer
  ).deploy(...params, { nonce });
  await deployed.waitForDeployment();
  console.log(`Contract deployed at ${deployed.target} with params`, params);
  return await deployed.getAddress();
}
