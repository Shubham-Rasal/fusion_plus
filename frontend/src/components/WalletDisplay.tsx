"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { truncateAddress } from "@aptos-labs/wallet-adapter-react";
import { AptosWalletSelector } from "./AptosWalletSelector";
import { Button } from "./ui/button";
import { Coins, ChevronDown } from "lucide-react";

export function WalletDisplay() {
  const { account, connected: aptosConnected } = useWallet();

  return (
    <div className="flex items-center gap-3">
      {/* Original ConnectButton */}
      <ConnectButton />

      {/* Aptos Wallet */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Coins className="h-4 w-4" />
          <span>APTOS</span>
        </div>
        {aptosConnected && account ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 px-3 bg-white border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">
                  {account.ansName || truncateAddress(account.address?.toString())}
                </span>
              </div>
            </Button>
            <AptosWalletSelector />
          </div>
        ) : (
          <AptosWalletSelector />
        )}
      </div>
    </div>
  );
} 