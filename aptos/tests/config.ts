import {z} from 'zod'
import Sdk from '@1inch/cross-chain-sdk'
import * as process from 'node:process'

const bool = z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .pipe(z.boolean())

const ConfigSchema = z.object({
    SRC_CHAIN_RPC: z.string().url(),
    DST_CHAIN_RPC: z.string().url(),
    SRC_CHAIN_CREATE_FORK: bool.default('true'),
    DST_CHAIN_CREATE_FORK: bool.default('true')
})

const fromEnv = ConfigSchema.parse(process.env)

export const config = {
    chain: {
        source: {
            chainId: Sdk.NetworkEnum.ETHEREUM,
            url: fromEnv.SRC_CHAIN_RPC,
            rpcUrl: "http://127.0.0.1:8545",
            createFork: fromEnv.SRC_CHAIN_CREATE_FORK,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            ownerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            blockNumber: 19991288,
            tokens: {
                USDC: {
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: '0x55fe002aeff02f77364de339a1292923a15844b8'
                }
            }
        },
        base: {
            chainId: Sdk.NetworkEnum.COINBASE,
            url: fromEnv.DST_CHAIN_RPC,
            createFork: fromEnv.DST_CHAIN_CREATE_FORK,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0x4200000000000000000000000000000000000006',
            ownerPrivateKey: '0x123',
            tokens: {
                USDC: {
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: '0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa'
                }
            }
        },
        aptos: {
            chainId: "APTOS",
            url: "https://fullnode.mainnet.aptoslabs.com/v1",
            createFork: false,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            ownerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            blockNumber: 19991288,
            tokens: {
                MY_TOKEN: {
                    address: '0xa0b80x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken6991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: '0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c'
                }
            }    
        },
        destination: {
            chainId: Sdk.NetworkEnum.ETHEREUM,
            url: fromEnv.SRC_CHAIN_RPC,
            rpcUrl: "http://127.0.0.1:8546",
            createFork: fromEnv.SRC_CHAIN_CREATE_FORK,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            ownerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            blockNumber: 19991288,
            tokens: {
                USDC: {
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: '0x55fe002aeff02f77364de339a1292923a15844b8'
                }
            }
        },
    }
} as const

export type ChainConfig = (typeof config.chain)['source' | 'destination']
