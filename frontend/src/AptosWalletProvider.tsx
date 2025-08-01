"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import type { DappConfig } from "@aptos-labs/wallet-adapter-react";
import type { PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";
import { toast } from "sonner";
const searchParams =
  typeof window !== "undefined"
    ? new URL(window.location.href).searchParams
    : undefined;
// const deriveWalletsFrom = searchParams?.get("deriveWalletsFrom")?.split(",");


let dappImageURI: string | undefined;
if (typeof window !== "undefined") {
  dappImageURI = `${window.location.origin}${window.location.pathname}favicon.ico`;
}

export const WalletProvider = ({ children }: PropsWithChildren) => {

  const dappConfig: DappConfig = {
    network: Network.MAINNET,
    aptosApiKeys: {
      testnet: process.env.NEXT_PUBLIC_APTOS_API_KEY_TESNET,
      devnet: process.env.NEXT_PUBLIC_APTOS_API_KEY_DEVNET,
    },
    aptosConnect: {
      dappId: "57fa42a9-29c6-4f1e-939c-4eefa36d9ff5",
      dappImageURI,
    },
    mizuwallet: {
      manifestURL:
        "https://assets.mz.xyz/static/config/mizuwallet-connect-manifest.json",
    },
  };

  return (
    <AptosWalletAdapterProvider
      key={"default"}
    
      dappConfig={dappConfig}
      onError={(error) => {
        toast.error(error || "Unknown wallet error");
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};