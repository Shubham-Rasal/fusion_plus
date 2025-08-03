import { z } from 'zod';
import * as Sdk from '@1inch/cross-chain-sdk';
import * as process from 'node:process';

const bool = z
  .string()
  .transform((v) => v.toLowerCase() === 'true')
  .pipe(z.boolean());

const ConfigSchema = z.object({
  SRC_CHAIN_RPC: z.string().url(),
  DST_CHAIN_RPC: z.string().url(),
  SRC_CHAIN_CREATE_FORK: bool.default('true'),
  DST_CHAIN_CREATE_FORK: bool.default('true'),
  RELAYER_PRIVATE_KEY: z.string(),
  APTOS_PRIVATE_KEY: z.string(),
  APTOS_ADDRESS: z.string(),
  SERVER_PORT: z.string().transform(Number).default('3001'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
});

const fromEnv = ConfigSchema.parse(process.env);

export const config = {
  server: {
    port: fromEnv.SERVER_PORT,
    logLevel: fromEnv.LOG_LEVEL
  },
  relayer: {
    privateKey: fromEnv.RELAYER_PRIVATE_KEY,
    aptosPrivateKey: fromEnv.APTOS_PRIVATE_KEY,
    aptosAddress: fromEnv.APTOS_ADDRESS
  },
  chain: {
    source: {
      chainId: Sdk.NetworkEnum.COINBASE, // Base chain
      url: fromEnv.SRC_CHAIN_RPC, // Fixed: use SRC_CHAIN_RPC for source
      createFork: fromEnv.SRC_CHAIN_CREATE_FORK, // Fixed: use SRC_CHAIN_CREATE_FORK for source
      rpcUrl: "http://127.0.0.1:8545",
      limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
      wrappedNative: '0x4200000000000000000000000000000000000006',
      ownerPrivateKey: '',
      tokens: {
          USDC: {
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              donor: '0xCE01B8865C6144A745473DE26ad35A2483Dd54eC'
          }
      }
  },
    destination: {
      chainId: Sdk.NetworkEnum.COINBASE, // Ethereum mainnet
      url: fromEnv.DST_CHAIN_RPC,
      rpcUrl: "http://127.0.0.1:8546",
      createFork: fromEnv.DST_CHAIN_CREATE_FORK,
      limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
      wrappedNative: '0x4200000000000000000000000000000000000006',
      ownerPrivateKey: '',
      tokens: {
          USDC: {
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              donor: '0xCE01B8865C6144A745473DE26ad35A2483Dd54eC'
          }
      }
    },
    aptos: {
      chainId: "APTOS",
      url: "https://fullnode.mainnet.aptoslabs.com/v1",
      createFork: false,
      limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
      wrappedNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      ownerPrivateKey: fromEnv.APTOS_PRIVATE_KEY,
      blockNumber: 19991288,
      tokens: {
        MY_TOKEN: {
          address: '0xa0b80x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken6991c6218b36c1d19d4a2e9eb0ce3606eb48',
          donor: '0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c'
        }
      }
    }
  }
} as const;

export type ChainConfig = (typeof config.chain)['source' | 'destination']; 