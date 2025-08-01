import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { CheckCircle, Clock, AlertCircle, ExternalLink, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SwapStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'loading' | 'completed' | 'failed'
  transactionHash?: string
  error?: string
}

interface SwapProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromToken: { symbol: string; chain: string } | null
  toToken: { symbol: string; chain: string } | null
  fromAmount: string
  toAmount: string
  onConfirm: () => Promise<void>
}

export function SwapProgressDialog({
  open,
  onOpenChange,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  onConfirm
}: SwapProgressDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<SwapStep[]>([])

  // Update steps when props change
  useEffect(() => {
    setSteps([
      {
        id: 'create-source-escrow',
        title: 'Creating Source Escrow',
        description: 'Setting up escrow contract on source chain',
        status: 'pending'
      },
      {
        id: 'deposit-source-funds',
        title: 'Depositing Funds',
        description: `Depositing ${fromAmount} ${fromToken?.symbol} to source escrow`,
        status: 'pending'
      },
      {
        id: 'create-destination-escrow',
        title: 'Creating Destination Escrow',
        description: 'Setting up escrow contract on destination chain',
        status: 'pending'
      },
      {
        id: 'deposit-destination-funds',
        title: 'Depositing Destination Funds',
        description: `Depositing ${toAmount} ${toToken?.symbol} to destination escrow`,
        status: 'pending'
      },
      {
        id: 'share-secret',
        title: 'Sharing Secret',
        description: 'Exchanging cryptographic secrets between chains',
        status: 'pending'
      },
      {
        id: 'swap-complete',
        title: 'Swap Complete',
        description: 'Cross-chain swap successfully completed',
        status: 'pending'
      }
    ])
  }, [fromAmount, toAmount, fromToken?.symbol, toToken?.symbol])

  const handleConfirm = async () => {
    setIsConfirming(true)
    setIsProcessing(true)
    setCurrentStep(0)
    
    try {
      await onConfirm()
      
      // Simulate the swap process with realistic delays
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i)
        
        // Update step status to loading
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'loading' as const } : step
        ))
        
        // Simulate processing time (2-4 seconds per step)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
        
        // Generate mock transaction hash
        const mockTxHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`
        
        // Update step status to completed
        setSteps(prev => prev.map((step, index) => 
          index === i ? { 
            ...step, 
            status: 'completed' as const,
            transactionHash: mockTxHash
          } : step
        ))
      }
      
      // Final delay before closing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      // Handle error by marking current step as failed
      setSteps(prev => prev.map((step, index) => 
        index === currentStep ? { 
          ...step, 
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        } : step
      ))
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepIcon = (step: SwapStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'loading':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getExplorerUrl = (chain: string, txHash: string) => {
    const chainExplorers: Record<string, string> = {
      'Ethereum': 'https://etherscan.io',
      'Polygon': 'https://polygonscan.com',
      'BSC': 'https://bscscan.com',
      'Arbitrum': 'https://arbiscan.io',
      'Optimism': 'https://optimistic.etherscan.io',
      'Aptos': 'https://explorer.aptoslabs.com'
    }
    
    const baseUrl = chainExplorers[chain] || 'https://etherscan.io'
    return `${baseUrl}/tx/${txHash}`
  }

  const isCompleted = steps.every(step => step.status === 'completed')
  const hasError = steps.some(step => step.status === 'failed')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isCompleted ? 'Swap Completed!' : 
             hasError ? 'Swap Failed' : 
             isProcessing ? 'Processing Swap...' : 'Confirm Swap'}
          </DialogTitle>
          <DialogDescription>
            {isCompleted ? 'Your cross-chain swap has been successfully completed.' :
             hasError ? 'There was an error processing your swap. Please try again.' :
             isProcessing ? 'Please wait while we process your swap across multiple chains.' :
             `Swap ${fromAmount} ${fromToken?.symbol} on ${fromToken?.chain} for ${toAmount} ${toToken?.symbol} on ${toToken?.chain}`}
          </DialogDescription>
        </DialogHeader>

        {!isProcessing && !isCompleted && !hasError && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">You pay</span>
                <span className="text-sm text-gray-600">{fromAmount} {fromToken?.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">You receive</span>
                <span className="text-sm text-gray-600">{toAmount} {toToken?.symbol}</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>• This swap will be processed across multiple blockchain networks</p>
              <p>• Each step requires a separate transaction</p>
              <p>• You can track progress and verify transactions below</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={cn(
                        "text-sm font-medium",
                        step.status === 'completed' ? 'text-green-700' :
                        step.status === 'failed' ? 'text-red-700' :
                        step.status === 'loading' ? 'text-blue-700' :
                        'text-gray-700'
                      )}>
                        {step.title}
                      </h4>
                      {step.transactionHash && (
                        <a
                          href={getExplorerUrl(fromToken?.chain || 'Ethereum', step.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    {step.error && (
                      <p className="text-xs text-red-500 mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">Swap Successfully Completed</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Your tokens have been successfully swapped across chains. You can view all transactions below.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Transaction Details:</h4>
              {steps.filter(step => step.transactionHash).map((step) => (
                <div key={step.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{step.title}:</span>
                  <a
                    href={getExplorerUrl(fromToken?.chain || 'Ethereum', step.transactionHash!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    {step.transactionHash?.slice(0, 8)}...{step.transactionHash?.slice(-6)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasError && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-800">Swap Failed</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                There was an error processing your swap. Please try again or contact support.
              </p>
            </div>
            
            {steps.find(step => step.status === 'failed')?.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Error: {steps.find(step => step.status === 'failed')?.error}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {!isProcessing && !isCompleted && !hasError && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Confirming...
                  </>
                ) : (
                  'Confirm Swap'
                )}
              </Button>
            </>
          )}
          
          {(isCompleted || hasError) && (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              {isCompleted ? 'Done' : 'Close'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 