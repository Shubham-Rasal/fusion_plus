import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import SwapComponent from "./swap";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Toaster } from '@/components/ui/sonner';
import { AptosWalletDisplay } from './components/AptosWalletDisplay';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AptosWalletAdapterProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Fusion Plus Swap</h1>
                  <div className="flex items-center gap-3">
                    <AptosWalletDisplay />
                    <ConnectButton />
                  </div>
                </div>
                              <SwapComponent />
            </div>
          </div>
          <Toaster />
        </AptosWalletAdapterProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
