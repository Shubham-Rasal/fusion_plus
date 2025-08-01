"use client";

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button } from "@/components/ui/button";
import { ChevronDown, Copy, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { AptosWalletSelector } from './AptosWalletSelector';
import { useAptosWallet } from '@/lib/aptosWallet';

export function AptosWalletDisplay() {
  const { account, connected, disconnect } = useWallet();
  const { getAptosTokens } = useAptosWallet();

  const copyAddress = async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address.toString());
      toast.success("Copied Aptos wallet address to clipboard.");
    } catch {
      toast.error("Failed to copy wallet address.");
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get APT token balance
  const aptTokens = getAptosTokens();
  const aptToken = aptTokens.find(token => token.symbol === 'APT');
  const aptBalance = aptToken?.formattedBalance || "0";

  if (!connected) {
    return <AptosWalletSelector />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border-gray-200 shadow-sm hover:bg-white">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">
              {account?.ansName || truncateAddress(account?.address?.toString() || "")}
            </span>
            <span className="text-xs text-gray-500">{aptBalance} APT</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={copyAddress} className="gap-2">
          <Copy className="h-4 w-4" /> Copy address
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={disconnect} className="gap-2">
          <LogOut className="h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 