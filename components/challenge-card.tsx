import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Trophy, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { 
  getChainId,
  getChainConfig, 
  getSteleContractAddress
} from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"
import { useWallet } from "@/app/hooks/useWallet"

interface ChallengeCardProps {
  id?: string
  title: string
  type: string
  participants: number
  timeLeft: string
  prize: string
  progress: number
  status: "active" | "pending" | "completed"
  startTime: string
  endTime: string
  isCompleted: boolean
  walletAddress?: string
  challengeId: string
}

export function ChallengeCard({ title, type, participants, timeLeft, prize, progress, status, id, startTime, endTime, isCompleted, walletAddress, challengeId }: ChallengeCardProps) {
  // If no ID is provided, convert the title to kebab-case and use it as ID
  const displayId = id || title.toLowerCase().replace(/\s+/g, '-');
  
  const [startDate, setStartDate] = useState<string>("Not started yet");
  const [isCreating, setIsCreating] = useState(false);
  
  // Use wallet hook to get current wallet info
  const { walletType, network } = useWallet();
  
  useEffect(() => {
    // Handle display for challenges that haven't started yet
    const hasStarted = startTime && startTime !== "0";
    if (hasStarted) {
      // Detect user's browser locale only on client side
      const userLocale = navigator.language;
      const formattedDate = new Date(Number(startTime) * 1000).toLocaleDateString(userLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setStartDate(formattedDate);
    } else {
      setStartDate("Not started yet");
    }
  }, [startTime]);

  // Function to map challenge type string to number for contract call
  const getChallengeTypeNumber = (type: string): number => {
    switch (type.toLowerCase()) {
      case "1 week challenge":
        return 0;
      case "1 month challenge":
        return 1;
      case "3 months challenge":
        return 2;
      case "6 months challenge":
        return 3;
      case "1 year challenge":
        return 4;
      default:
        return 0; // Default to 1 week challenge
    }
  };

  // Handle Create Challenge
  const handleCreateChallenge = async () => {
    setIsCreating(true);
    
    try {
      let walletProvider;
      
      // Get the appropriate wallet provider based on connected wallet type
      if (walletType === 'metamask') {
        if (typeof (window as any).ethereum === 'undefined') {
          throw new Error("MetaMask is not installed. Please install it from https://metamask.io/");
        }
        
        // For MetaMask, find the correct provider
        if ((window as any).ethereum.providers) {
          walletProvider = (window as any).ethereum.providers.find((provider: any) => provider.isMetaMask);
        } else if ((window as any).ethereum.isMetaMask) {
          walletProvider = (window as any).ethereum;
        }
        
        if (!walletProvider) {
          throw new Error("MetaMask provider not found");
        }
      } else if (walletType === 'phantom') {
        if (typeof window.phantom === 'undefined') {
          throw new Error("Phantom wallet is not installed. Please install it from https://phantom.app/");
        }

        if (!window.phantom?.ethereum) {
          throw new Error("Ethereum provider not found in Phantom wallet");
        }
        
        walletProvider = window.phantom.ethereum;
      } else {
        throw new Error("No wallet connected. Please connect your wallet first.");
      }

      // Request account access
      const accounts = await walletProvider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error(`No accounts found. Please connect to ${walletType} wallet first.`);
      }

      // Check if we are on correct network
      const chainId = await walletProvider.request({
        method: 'eth_chainId'
      });

      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
      const targetChainId = getChainId(contractNetwork);
      
      if (chainId !== targetChainId) {
        // Switch to target network
        try {
          await walletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to the wallet
          if (switchError.code === 4902) {
            await walletProvider.request({
              method: 'wallet_addEthereumChain',
              params: [getChainConfig(contractNetwork)],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Create a Web3Provider using the current wallet provider
      const provider = new ethers.BrowserProvider(walletProvider);
      
      // Get the signer
      const signer = await provider.getSigner();
      
      // Create contract instance
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Get the challenge type number
      const challengeTypeNumber = getChallengeTypeNumber(type);

      // Call createChallenge with the challenge type
      const tx = await steleContract.createChallenge(challengeTypeNumber);
      
      // Show toast notification for transaction submitted
      toast({
        title: "Transaction Submitted",
        description: "Your challenge creation transaction has been sent to the network.",
        action: (
          <ToastAction altText="View on Etherscan" onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}>
            View on Etherscan
          </ToastAction>
        ),
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Show toast notification for transaction confirmed
      toast({
        title: "Challenge Created",
        description: `Your ${type} has been created successfully!`,
        action: (
          <ToastAction altText="View on Etherscan" onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}>
            View on Etherscan
          </ToastAction>
        ),
      });
      
    } catch (error: any) {
      console.error("Error creating challenge:", error);
      
      // Show toast notification for error
      toast({
        variant: "destructive",
        title: "Error Creating Challenge",
        description: error.message || "An unknown error occurred",
      });
      
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Card className="overflow-hidden bg-gray-900/50 border-gray-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-100">{title}</CardTitle>
          <Badge
            variant={status === "active" ? "default" : status === "pending" ? "outline" : "secondary"}
            className={status === "active" ? "bg-emerald-500" : status === "pending" ? "border-gray-600 text-gray-300" : ""}
          >
            {status === "active" ? "Active" : status === "pending" ? "Pending" : "Completed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-gray-400 mb-4">
          <div className="flex items-center mr-4">
            <Clock className="mr-1 h-4 w-4" />
            {startDate}
          </div>
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            {participants} participants
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="font-medium text-gray-100">
              {timeLeft.toLowerCase() === "completed" ? timeLeft : `${timeLeft} left`}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-400">Total Prize</div>
          <div className="text-xl font-bold mt-1 text-gray-100">{prize}</div>
        </div>
      </CardContent>
      <CardFooter>
        {(() => {
          // View Challenge button is always visible
          const showViewChallenge = true;
          
          // Create Challenge button is shown when challengeId is "0" (not created yet), isCompleted is true, or current time has passed endTime
          const currentTime = new Date();
          const endTimeDate = new Date(Number(endTime) * 1000);
          const showCreateChallenge = challengeId === "0" || !challengeId || isCompleted || currentTime > endTimeDate;

          // When both buttons are visible
          if (showViewChallenge && showCreateChallenge) {
            return (
              <div className="flex gap-2 w-full">
                <Link href={`/challenge/${challengeId}`} className="flex-1">
                  <Button className="w-full">
                    <Trophy className="mr-2 h-4 w-4" />
                    View Challenge
                  </Button>
                </Link>
                <Button 
                  className="flex-1 bg-gray-800 text-gray-100 border-gray-600 hover:bg-gray-700" 
                  onClick={handleCreateChallenge}
                  disabled={isCreating}
                  variant="outline"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      Create Challenge
                    </>
                  )}
                </Button>
              </div>
            );
          }
          
          // When only View Challenge button is visible
          if (showViewChallenge && !showCreateChallenge) {
            return (
              <Link href={`/challenge/${challengeId}`} className="w-full">
                <Button className="w-full">
                  <Trophy className="mr-2 h-4 w-4" />
                  View Challenge
                </Button>
              </Link>
            );
          }

          // When only Create Challenge button is visible (this case shouldn't occur)
          return (
            <Button 
              className="w-full bg-gray-800 text-gray-100 border-gray-600 hover:bg-gray-700" 
              onClick={handleCreateChallenge}
              disabled={isCreating}
              variant="outline"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Create Challenge
                </>
              )}
            </Button>
          );
        })()}
      </CardFooter>
    </Card>
  )
}
