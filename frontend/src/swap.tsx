import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Wallet, ChevronDown, Settings, RefreshCw, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWallet } from "@/lib/wallet"
import type { TokenBalance } from "@/lib/wallet"
import { useAptosWallet } from "@/lib/aptosWallet"
import type { AptosTokenBalance } from "@/lib/aptosWallet"
import { AptosWalletSelector } from "@/components/AptosWalletSelector"
import { SwapProgressDialog } from "@/components/SwapProgressDialog"

export default function SwapComponent() {
  const {
    address,
    isConnected,
    selectedChain,
    setSelectedChain,
    currentChainConfig,
    getCurrentChainTokens,
    getAllTokens,
    switchToChain,
    chains,
    refreshBalances: refreshEthBalances,
    isRefreshing: isEthRefreshing,
  } = useWallet();

  const [fromToken, setFromToken] = useState<TokenBalance | null>(null)
  const [toToken, setToToken] = useState<AptosTokenBalance | null>(null)
  const [fromAmount, setFromAmount] = useState("0.00486")
  const [toAmount, setToAmount] = useState("0")
  const [activeTab, setActiveTab] = useState<"swap" | "limit">("swap")
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [showSwapDialog, setShowSwapDialog] = useState(false)

  const fromDropdownRef = useRef<HTMLDivElement>(null)
  const toDropdownRef = useRef<HTMLDivElement>(null)

  const currentTokens = getCurrentChainTokens();
  const allTokens = getAllTokens();
  const { connected: aptosConnected, getAptosTokens, refreshBalances: refreshAptosBalances, isRefreshing: isAptosRefreshing } = useAptosWallet();
  const aptosTokens = getAptosTokens();

  useEffect(() => {
    if (currentTokens.length > 0) {
      // Set USDC as default from token
      const usdcToken = currentTokens.find(token => token.symbol === 'USDC');
      if (usdcToken) {
        setFromToken(usdcToken);
      }

      // Set APT as default to token (from Aptos)
      const aptToken = aptosTokens.find(token => token.symbol === 'APT');
      if (aptToken) {
        setToToken(aptToken);
      }
    }
  }, [currentTokens, aptosTokens]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  const handleSwap = async () => {
    if (!fromAmount || !toAmount || !isConnected) return
    setShowSwapDialog(true)
  }

  const handleSwapConfirm = async () => {
    // This is where the actual swap logic would go
    // For now, we'll just simulate the process
    console.log('Starting swap process...')
    
    // In a real implementation, you would:
    // 1. Create source escrow
    // 2. Deposit funds to source escrow
    // 3. Create destination escrow
    // 4. Deposit funds to destination escrow
    // 5. Share secrets between chains
    // 6. Complete the swap
    
    // For demo purposes, we'll just wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    // Simple mock calculation - in real app this would call price API
    if (value && fromToken && toToken) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Mock exchange rate (1:1 for demo)
        setToAmount((numValue * 1).toFixed(6));
      } else {
        setToAmount("0");
      }
    } else {
      setToAmount("0");
    }
  }

  const handleTokenSelect = (token: TokenBalance | AptosTokenBalance, isFrom: boolean) => {
    if (isFrom) {
      setFromToken(token as TokenBalance)
      setShowFromDropdown(false)
      // Reset amounts when changing from token
      setFromAmount("")
      setToAmount("")
    } else {
      setToToken(token as AptosTokenBalance)
      setShowToDropdown(false)
      // Recalculate to amount when changing to token
      if (fromAmount && fromToken) {
        handleFromAmountChange(fromAmount);
      }
    }
  }

  const handleChainSwitch = async (chainId: string) => {
    const chainConfig = chains.find(chain => chain.id === chainId);
    if (chainConfig) {
      setSelectedChain(chainId);
      await switchToChain(chainConfig.chainId);
    }
  }

  const handleRefresh = async () => {
    // Refresh balances for both chains
    await Promise.all([
      refreshEthBalances(),
      refreshAptosBalances(),
    ]);
  }

  const isSwapDisabled = !isConnected || !aptosConnected || !fromAmount || Number.parseFloat(fromAmount) <= 0.001 || !fromToken || !toToken

  if (!isConnected) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Connect Wallet</h2>
            <p className="text-gray-600 text-sm">Connect your wallet to start swapping tokens</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-center text-gray-500 text-sm">
              Please use the Connect Wallet button in the header to connect your wallet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!aptosConnected) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Connect Aptos Wallet</h2>
            <p className="text-gray-600 text-sm">Connect your Aptos wallet to receive tokens</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <AptosWalletSelector />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-2xl overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("swap")}
                className={cn(
                  "text-lg font-medium px-0 mr-6 hover:bg-transparent",
                  activeTab === "swap" ? "text-gray-900" : "text-gray-500 hover:text-gray-700",
                )}
              >
                Swap
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("limit")}
                className={cn(
                  "text-lg font-medium px-0 hover:bg-transparent",
                  activeTab === "limit" ? "text-gray-900" : "text-gray-500 hover:text-gray-700",
                )}
              >
                Limit
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isEthRefreshing || isAptosRefreshing}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", (isEthRefreshing || isAptosRefreshing) && "animate-spin")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-1 px-6 pb-6">
          {/* From Token */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">You pay</span>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Balance: {fromToken?.formattedBalance || "0"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => handleFromAmountChange(fromToken?.formattedBalance || "")}
                >
                  MAX
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 relative">
              
                <div className="relative" ref={fromDropdownRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setShowFromDropdown(!showFromDropdown)}
                    className="flex items-center gap-1 p-0 h-auto hover:bg-transparent"
                  >
                    <span className="font-medium text-gray-900">{fromToken?.symbol || "Select"}</span>
                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", showFromDropdown && "rotate-180")} />
                  </Button>
                  <div className="text-xs text-gray-500">on {fromToken?.chain || currentChainConfig?.name}</div>

                  {/* From Token Dropdown */}
                  {showFromDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-10">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 px-3 py-2">Select token</div>
                        {currentTokens.map((token) => (
                          <Button
                            key={token.symbol}
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTokenSelect(token, true);
                            }}
                            className="w-full justify-start gap-3 h-12 px-3 hover:bg-gray-100 text-gray-900"
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{token.symbol}</span>
                              <span className="text-xs text-gray-500">{token.name}</span>
                            </div>
                            <div className="ml-auto text-right">
                              <div className="text-sm">{token.formattedBalance}</div>
                              <div className="text-xs text-gray-500">on {token.chain}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <Input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className="text-right text-2xl font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-gray-900 w-32"
                  placeholder="0"
                />
                <div className="text-xs text-gray-500 mt-1">~$0.00048{fromAmount.slice(7)}</div>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwapTokens}
              className="h-10 w-10 p-0 rounded-full bg-gray-200 hover:bg-gray-300 border border-gray-300"
            >
              <ArrowDown className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          {/* To Token */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">You receive</span>
              <div className="text-sm text-gray-600">Balance: {toToken?.formattedBalance || "0"}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 relative">
                <div className="relative" ref={toDropdownRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setShowToDropdown(!showToDropdown)}
                    className="flex items-center gap-1 p-0 h-auto hover:bg-transparent"
                  >
                    <span className="font-medium text-gray-900">{toToken?.symbol || "Select"}</span>
                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", showToDropdown && "rotate-180")} />
                  </Button>
                  <div className="text-xs text-gray-500">on Aptos</div>

                  {/* To Token Dropdown - APT and FUSION tokens */}
                  {showToDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-10">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 px-3 py-2">Select Aptos token</div>
                        {aptosTokens
                          .filter(token => token.symbol === "APT" || token.symbol === "FUSION")
                          .map((token) => (
                          <Button
                            key={token.symbol}
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTokenSelect(token, false);
                            }}
                            className="w-full justify-start gap-3 h-12 px-3 hover:bg-gray-100 text-gray-900"
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{token.symbol}</span>
                              <span className="text-xs text-gray-500">{token.name}</span>
                            </div>
                            <div className="ml-auto text-right">
                              <div className="text-sm">{token.formattedBalance}</div>
                              <div className="text-xs text-gray-500">on Aptos</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-medium text-gray-900">{toAmount}</div>
                <div className="text-xs text-gray-500 mt-1">~$0 (-100%)</div>
              </div>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="flex items-center justify-between py-4 text-sm">
            <div className="text-gray-600">
              {fromToken && toToken ? `1 ${fromToken.symbol} = ${toAmount ? (parseFloat(toAmount) / parseFloat(fromAmount || "1")).toFixed(6) : "0"} ${toToken.symbol}` : "Select tokens"}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="h-2 w-2 bg-emerald-600 rounded-full"></div>
                <span className="text-sm font-medium">Free</span>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </div>
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isSwapDisabled}
            className={cn(
              "w-full h-14 text-base font-medium rounded-2xl transition-all duration-200",
              isSwapDisabled
                ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
                : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/25",
            )}
          >
            {isSwapDisabled ? (
              !isConnected ? "Connect Wallet" : 
              !aptosConnected ? "Connect Aptos Wallet" :
              !fromToken || !toToken ? "Select tokens" :
              "Swap amount for Cross-chain is too small."
            ) : (
              "Swap"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Swap Progress Dialog */}
      <SwapProgressDialog
        open={showSwapDialog}
        onOpenChange={setShowSwapDialog}
        fromToken={fromToken}
        toToken={toToken}
        fromAmount={fromAmount}
        toAmount={toAmount}
        onConfirm={handleSwapConfirm}
      />
    </div>
  )
}
