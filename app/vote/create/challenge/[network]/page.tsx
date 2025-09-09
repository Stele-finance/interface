'use client'

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, DollarSign, Plus, Loader2, ArrowLeft } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ethers } from "ethers"
import { 
  getSteleContractAddress,
  getGovernanceContractAddress,
  getExplorerName,
  getExplorerUrl
} from "@/lib/constants"
import GovernorABI from "@/app/abis/SteleGovernor.json"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import Image from "next/image"

// Predefined governance proposal templates
interface ProposalTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  targetContract: string
  functionSignature: string
  parameterTypes: string[]
  parameterLabels: string[]
  parameterPlaceholders: string[]
  parameterDescriptions: string[]
}

interface CreateProposalPageProps {
  params: Promise<{
    network: string
  }>
}

export default function CreateProposalPage({ params }: CreateProposalPageProps) {
  const { network: urlNetwork } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t, language } = useLanguage()
  const { walletType, getProvider, isConnected: walletConnected, address: walletAddress } = useWallet()
  
  // Use URL network parameter for contracts
  const contractNetwork = urlNetwork === 'ethereum' || urlNetwork === 'arbitrum' ? urlNetwork : 'ethereum'

  const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
    {
      id: 'set-token',
      name: t('setInvestableTokenTemplate'),
      description: t('setInvestableTokenDesc'),
      icon: <Settings className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'setToken(address)',
      parameterTypes: ['address'],
      parameterLabels: [t('tokenAddressLabel')],
      parameterPlaceholders: ['0x...'],
      parameterDescriptions: [t('tokenAddressDesc')]
    },
    {
      id: 'reset-token',
      name: t('resetInvestableTokenTemplate'),
      description: t('resetInvestableTokenDesc'),
      icon: <Settings className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'resetToken(address)',
      parameterTypes: ['address'],
      parameterLabels: [t('tokenAddressLabel')],
      parameterPlaceholders: ['0x...'],
      parameterDescriptions: [t('tokenAddressRemoveDesc')]
    },
    {
      id: 'set-reward-ratio',
      name: t('setRewardRatioTemplate'),
      description: t('setRewardRatioDesc'),
      icon: <DollarSign className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'setRewardRatio(uint256[5])',
      parameterTypes: ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
      parameterLabels: [
        t('firstPlaceLabel'),
        t('secondPlaceLabel'),
        t('thirdPlaceLabel'),
        t('fourthPlaceLabel'),
        t('fifthPlaceLabel')
      ],
      parameterPlaceholders: ['50', '26', '13', '7', '4'],
      parameterDescriptions: [
        t('firstPlaceDesc'),
        t('secondPlaceDesc'),
        t('thirdPlaceDesc'),
        t('fourthPlaceDesc'),
        t('fifthPlaceDesc')
      ]
    },
    {
      id: 'set-entry-fee',
      name: t('setEntryFeeTemplate'),
      description: t('setEntryFeeDesc'),
      icon: <DollarSign className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'setEntryFee(uint256)',
      parameterTypes: ['uint256'],
      parameterLabels: [t('entryFeeLabel')],
      parameterPlaceholders: ['10000000'],
      parameterDescriptions: [t('entryFeeParamDesc')]
    },
    {
      id: 'set-max-tokens',
      name: t('setMaxTokensTemplate'),
      description: t('setMaxTokensDesc'),
      icon: <Settings className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'setMaxTokens(uint8)',
      parameterTypes: ['uint8'],
      parameterLabels: [t('maxTokensCountLabel')],
      parameterPlaceholders: ['10'],
      parameterDescriptions: [t('maxTokensParamDesc')]
    },
    {
      id: 'set-seed-money',
      name: t('setSeedMoneyTemplate'),
      description: t('setSeedMoneyDesc'),
      icon: <DollarSign className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'setSeedMoney(uint256)',
      parameterTypes: ['uint256'],
      parameterLabels: [t('seedMoneyAmountLabel')],
      parameterPlaceholders: ['10000000000'],
      parameterDescriptions: [t('seedMoneyParamDesc')]
    },
    {
      id: 'set-create-bonus',
      name: t('setCreateBonusTemplate'),
      description: t('setCreateBonusDesc'),
      icon: <DollarSign className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'setCreateBonus(uint256)',
      parameterTypes: ['uint256'],
      parameterLabels: [t('createBonusAmountLabel')],
      parameterPlaceholders: ['1000000000000000000'],
      parameterDescriptions: [t('createBonusParamDesc')]
    },
    {
      id: 'set-join-bonus',
      name: t('setJoinBonusTemplate'),
      description: t('setJoinBonusDesc'),
      icon: <DollarSign className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'setJoinBonus(uint256)',
      parameterTypes: ['uint256'],
      parameterLabels: [t('joinBonusAmountLabel')],
      parameterPlaceholders: ['500000000000000000'],
      parameterDescriptions: [t('joinBonusParamDesc')]
    },
    {
      id: 'set-get-rewards-bonus',
      name: t('setGetRewardsBonusTemplate'),
      description: t('setGetRewardsBonusDesc'),
      icon: <DollarSign className="h-5 w-5" />,
      targetContract: getSteleContractAddress(contractNetwork),
      functionSignature: 'setGetRewardsBonus(uint256)',
      parameterTypes: ['uint256'],
      parameterLabels: [t('getRewardsBonusAmountLabel')],
      parameterPlaceholders: ['200000000000000000'],
      parameterDescriptions: [t('getRewardsBonusParamDesc')]
    },
    {
      id: 'set-voting-period',
      name: t('setVotingPeriodTemplate'),
      description: t('setVotingPeriodDesc'),
      icon: <Settings className="h-5 w-5" />,
      targetContract: getGovernanceContractAddress(contractNetwork),
      functionSignature: 'setVotingPeriod(uint256)',
      parameterTypes: ['uint256'],
      parameterLabels: [t('votingPeriodBlocksLabel')],
      parameterPlaceholders: ['50400'],
      parameterDescriptions: [t('votingPeriodParamDesc')]
    }
  ]
  
  // Removed local wallet state - using useWallet hook directly
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [details, setDetails] = useState("")
  
  // Template-based proposal state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isCustomProposal, setIsCustomProposal] = useState(false)
  const [templateParameters, setTemplateParameters] = useState<string[]>([])
  
  // Legacy smart contract call data (for custom proposals)
  const [targetAddress, setTargetAddress] = useState("")
  const [functionSignature, setFunctionSignature] = useState("")
  const [functionParams, setFunctionParams] = useState("")
  
  // No longer needed - useWallet hook manages wallet state

  // Get appropriate explorer URL based on chain ID
  const getExplorerUrl = (chainId: string, txHash: string) => {
    switch (chainId) {
      case '0x1': // Ethereum Mainnet
        return `https://etherscan.io/tx/${txHash}`;
      case '0xa4b1': // Arbitrum One
        return `https://arbiscan.io/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`; // Default to Ethereum
    }
  };

  const getExplorerName = (chainId: string) => {
    switch (chainId) {
      case '0x1': // Ethereum Mainnet
        return 'Etherscan';
      case '0xa4b1': // Arbitrum One
        return 'Arbiscan';
      default:
        return 'Block Explorer';
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateName: string) => {
    if (templateName === t('customProposal')) {
      setIsCustomProposal(true);
      setSelectedTemplate('');
      setTemplateParameters([]);
    } else {
      setIsCustomProposal(false);
      const template = PROPOSAL_TEMPLATES.find(t => t.name === templateName);
      if (template) {
        setSelectedTemplate(template.id);
        setTemplateParameters(new Array(template.parameterTypes.length).fill(''));
      }
    }
  };

  // Update template parameter
  const updateTemplateParameter = (index: number, value: string) => {
    const newParams = [...templateParameters];
    newParams[index] = value;
    setTemplateParameters(newParams);
  };

  // Create calldata from template or custom input
  const createCalldata = () => {
    if (isCustomProposal) {
      // Legacy custom proposal logic
      if (!functionSignature || !targetAddress) return null;

      try {
        const funcName = functionSignature.split('(')[0];
        const paramTypes = functionSignature
          .split('(')[1]
          .replace(')', '')
          .split(',')
          .filter(p => p.trim().length > 0);

        let params: any[] = [];
        if (functionParams && paramTypes.length > 0) {
          params = functionParams.split(',').map((p: string, i: number) => {
            const paramType = paramTypes[i].trim();
            const param = p.trim();

            if (paramType.includes('uint')) {
              return param.startsWith('0x') ? param : ethers.parseUnits(param, 0);
            } else if (paramType.includes('bool')) {
              return param.toLowerCase() === 'true';
            } else {
              return param;
            }
          });
        }

        const functionFragment = ethers.FunctionFragment.from(`function ${funcName}(${paramTypes.join(',')})`);
        const iface = new ethers.Interface([functionFragment]);
        const calldata = iface.encodeFunctionData(funcName, params);

        return calldata;
      } catch (error) {
        console.error("Error creating calldata:", error);
        toast({
          variant: "destructive",
          title: "Invalid Function Data",
          description: "Please check your function signature and parameters.",
        });
        return null;
      }
    } else {
      // Template-based proposal logic
      const template = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate);
      if (!template) return null;

      try {
        const funcName = template.functionSignature.split('(')[0];
        let paramTypes: string[];
        
        if (template.id === 'set-reward-ratio') {
          // For setRewardRatio, we need the actual function signature with uint256[5]
          paramTypes = ['uint256[5]'];
        } else {
          paramTypes = template.parameterTypes;
        }

        // Convert template parameters to proper types
        let params: any[] = [];
        
        if (template.id === 'set-reward-ratio') {
          // Special handling for setRewardRatio which needs an array of 5 uint256 values
          const rewardRatios = templateParameters.slice(0, 5).map(param => {
            const value = param.trim();
            return value.startsWith('0x') ? value : ethers.parseUnits(value, 0);
          });
          params = [rewardRatios];
        } else {
          // Regular parameter handling
          params = templateParameters.map((param, i) => {
            const paramType = paramTypes[i];
            const value = param.trim();

                         if (paramType.includes('uint8')) {
               // Handle uint8 specifically (0-255 range)
               const numValue = parseInt(value);
               if (numValue < 0 || numValue > 255) {
                 throw new Error('uint8 value must be between 0 and 255');
               }
               return numValue;
             } else if (paramType.includes('uint')) {
               return value.startsWith('0x') ? value : ethers.parseUnits(value, 0);
             } else if (paramType.includes('bool')) {
              return value.toLowerCase() === 'true';
            } else {
              return value;
            }
          });
        }

        const functionFragment = ethers.FunctionFragment.from(`function ${funcName}(${paramTypes.join(',')})`);
        const iface = new ethers.Interface([functionFragment]);
        const calldata = iface.encodeFunctionData(funcName, params);

        return calldata;
      } catch (error) {
        console.error("Error creating template calldata:", error);
        toast({
          variant: "destructive",
          title: "Invalid Template Parameters",
          description: "Please check your parameter values.",
        });
        return null;
      }
    }
  };
  
  // Proposal creation function
  const handleCreateProposal = async () => {
    // Validation
    if (!title || !description) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Title and description are required",
      })
      return
    }
    
    // Wallet connection check
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a proposal",
      })
      return
    }
    
    // Check if wallet is connected
    if (!walletConnected || !walletType) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "No wallet connected. Please connect your wallet first.",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Get provider using useWallet hook
      const browserProvider = getProvider();
      if (!browserProvider) {
        throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
      }

      // Try to get signer first, only request accounts if needed
      let signer;
      try {
        signer = await browserProvider.getSigner();
        await signer.getAddress(); // Verify we can get address
      } catch (error: any) {
        console.warn('Could not get signer, requesting accounts:', error);
        
        // Check if user rejected the request
        if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
          throw new Error("Connection request was rejected by user");
        }
        
        // Request account access as fallback
        const accounts = await browserProvider.send('eth_requestAccounts', []);

        if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts found. Please connect to ${walletType} wallet first.`);
        }
        
        signer = await browserProvider.getSigner();
      }

      // Get wallet's current network
      const walletChainId = await browserProvider.send('eth_chainId', []);
      const expectedChainId = contractNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
      
      // If wallet is on wrong network, switch to URL-based network
      if (walletChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        try {
          // Request network switch
          await browserProvider.send('wallet_switchEthereumChain', [
            { chainId: expectedChainId }
          ]);
        } catch (switchError: any) {
          // If network doesn't exist in wallet (error 4902), add it
          if (switchError.code === 4902) {
            try {
              const networkParams = contractNetwork === 'arbitrum' ? {
                chainId: expectedChainId,
                chainName: 'Arbitrum One',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://arbiscan.io']
              } : {
                chainId: expectedChainId,
                chainName: 'Ethereum Mainnet',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                blockExplorerUrls: ['https://etherscan.io']
              };
              
              await browserProvider.send('wallet_addEthereumChain', [networkParams]);
            } catch (addError) {
              const networkName = contractNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
              throw new Error(`Failed to add ${networkName} network. Please add it manually in your wallet settings.`);
            }
          } else if (switchError.code === 4001) {
            // User rejected the switch
            const networkName = contractNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
            throw new Error(`Please switch to ${networkName} network to create proposal.`);
          } else {
            throw switchError;
          }
        }
      }
      
      // Create contract instance with URL-based network
      const governorContract = new ethers.Contract(
        getGovernanceContractAddress(contractNetwork),
        GovernorABI.abi,
        signer
      );

      // Prepare proposal parameters
      let targets: string[] = [];
      let values: bigint[] = [];
      let calldatas: string[] = [];

      if (isCustomProposal) {
        // Custom proposal logic
        targets = targetAddress ? [targetAddress] : [];
        values = targetAddress ? [BigInt(0)] : [];
        
        if (targetAddress && functionSignature) {
          const calldata = createCalldata();
          if (calldata) {
            calldatas = [calldata];
          } else {
            throw new Error("Failed to create calldata. Please check function signature and parameters.");
          }
        } else if (targetAddress) {
          calldatas = ['0x'];
        }
      } else if (selectedTemplate) {
        // Template-based proposal logic
        const template = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate);
        if (!template) {
          throw new Error("Invalid template selected.");
        }

        targets = [template.targetContract];
        values = [BigInt(0)];
        
        const calldata = createCalldata();
        if (calldata) {
          calldatas = [calldata];
        } else {
          throw new Error("Failed to create calldata from template. Please check your parameter values.");
        }
      }
      
      // Combine title and description for the proposal
      const proposalDescription = `${title}: ${description}\n\n${details}`;

      // Only proceed if either we have no target (text proposal) or we have all necessary parameters
      if (targets.length === 0 || (targets.length > 0 && calldatas.length > 0)) {
        // Call the propose function on the governor contract
        const tx = await governorContract.propose(
          targets,
          values,
          calldatas,
          proposalDescription
        );
        
        setTransactionHash(tx.hash);
        
        // Show toast notification for transaction submitted
        const explorerName = getExplorerName(contractNetwork);
        const explorerUrl = getExplorerUrl(contractNetwork, tx.hash);
        
        toast({
          title: "Transaction Submitted",
          description: "Your proposal transaction has been sent to the network.",
          action: (
            <ToastAction 
              altText={`View on ${explorerName}`} 
              onClick={() => window.open(explorerUrl, '_blank')}
            >
              View on {explorerName}
            </ToastAction>
          ),
        });
        
        // Store the recently created proposal info for real-time update detection
        const recentlyCreatedProposal = {
          transactionHash: tx.hash,
          title: title,
          description: description,
          timestamp: Date.now()
        };
        localStorage.setItem('recentlyCreatedProposal', JSON.stringify(recentlyCreatedProposal));
        
        // Continue processing transaction in background
        try {
          // Wait for transaction to be mined
          const receipt = await tx.wait();
          
          // Show toast notification for transaction confirmed
          toast({
            title: "Proposal Created Successfully",
            description: "Your proposal has been confirmed on the blockchain",
            action: (
              <ToastAction 
                altText={`View on ${explorerName}`} 
                onClick={() => window.open(explorerUrl, '_blank')}
              >
                View on {explorerName}
              </ToastAction>
            ),
          });
        } catch (confirmationError) {
          console.error("Error waiting for transaction confirmation:", confirmationError);
          // Still navigate to vote page even if confirmation fails
        }
      } else {
        throw new Error("Invalid proposal parameters. Please check your inputs.");
      }
    } catch (error: any) {
      console.error("❌ Error creating proposal:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        reason: error.reason,
        stack: error.stack
      });
      
      let errorMessage = error.message || "An unknown error occurred";
      let toastVariant: "destructive" | "default" = "destructive";
      let toastTitle = "Proposal Creation Failed";
      
      // Provide more specific error messages based on error type
      // Check for various user rejection patterns
      if (error.code === 4001 || 
          error.code === "ACTION_REJECTED" ||
          error.message?.includes('rejected') || 
          error.message?.includes('denied') || 
          error.message?.includes('cancelled') ||
          error.message?.includes('User rejected') ||
          error.message?.includes('User denied') ||
          error.message?.includes('Connection request was rejected')) {
        errorMessage = "Transaction was cancelled by user";
        toastVariant = "default";
        toastTitle = "Transaction Cancelled";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (error.message?.includes("Failed to get wallet provider")) {
        errorMessage = "Wallet connection lost. Please reconnect your wallet.";
      } else if (error.message?.includes("No accounts found")) {
        errorMessage = "No wallet accounts found. Please check your wallet connection.";
      }
      
      toast({
        variant: toastVariant,
        title: toastTitle,
        description: errorMessage,
      });
    } finally {
      // Always ensure loading state is cleared, even if there are unexpected errors
      setIsSubmitting(false);
      
      // Navigate to vote page only if there's no error and we have stored proposal data
      const storedProposal = localStorage.getItem('recentlyCreatedProposal');
      if (storedProposal) {
        // Wait 1 second after submitting state ends before navigating
        setTimeout(async () => {
          // Invalidate all proposal-related queries to refresh vote page data
          await queryClient.invalidateQueries({ queryKey: ['proposals'] });
          await queryClient.invalidateQueries({ queryKey: ['activeProposals'] });
          await queryClient.invalidateQueries({ queryKey: ['proposalsByStatus'] });
          await queryClient.invalidateQueries({ queryKey: ['multipleProposalVoteResults'] });
          
          // Navigate to challenge vote page
          router.push("/vote/challenge");
        }, 1000);
      }
    }
  }
  
  return (
    <div className="container mx-auto px-2 py-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="mb-2">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </button>
        </div>
        
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              {contractNetwork === 'arbitrum' ? (
                <Image
                  src="/networks/small/arbitrum.png"
                  alt="Arbitrum"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <Image
                  src="/networks/small/ethereum.png"
                  alt="Ethereum"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              {t('createProposalPage')}
            </h1>
            <p className="text-gray-400 mt-1">{t('submitNewGovernanceProposal')}</p>
          </div>
        </div>
        <Card className="bg-transparent border border-gray-700/50">
          <CardContent className="space-y-8 p-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              
              <div className="grid gap-6">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-gray-200 text-base font-medium">
                    {t('proposalTitle')}
                  </Label>
                  <Input 
                    id="title" 
                    placeholder={t('enterProposalTitle')} 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-gray-800/30 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-12 text-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-gray-200 text-base font-medium">
                    {t('shortDescription')}
                  </Label>
                  <Textarea 
                    id="description" 
                    placeholder={t('provideProposalSummary')} 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-gray-800/30 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 min-h-[100px] text-base"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="details" className="text-gray-200 text-base font-medium">
                    {t('detailedDescriptionVote')}
                  </Label>
                  <Textarea 
                    id="details" 
                    placeholder={t('detailedDescriptionPlaceholder')} 
                    className="min-h-[200px] bg-gray-800/30 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 text-base"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            
            {/* Governance Action Section */}
            <div className="space-y-6">
              <div className="border-b border-gray-700/50 pb-4">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t('governanceActionVote')}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {t('defineOnChainAction')}
                </p>
              </div>
              
              <div className="bg-gray-800/20 border border-gray-600/50 rounded-lg p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="template" className="text-gray-200 text-base font-medium">
                    {t('selectProposalTypeVote')}
                  </Label>
                  <Select onValueChange={handleTemplateSelect} disabled={isSubmitting}>
                    <SelectTrigger className="bg-gray-800/30 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500/20 h-12">
                      <SelectValue placeholder={t('chooseGovernanceAction')} />
                    </SelectTrigger>
                    <SelectContent className="bg-black/80 border-gray-600">
                      {PROPOSAL_TEMPLATES.map((template) => (
                        <SelectItem key={template.id} value={template.name} className="text-gray-100 focus:bg-gray-700">
                          {template.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={t('customProposal')} className="text-gray-100 focus:bg-gray-700">
                        {t('customProposal')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                {/* Template Parameters */}
                {selectedTemplate && !isCustomProposal && (
                  <div className="space-y-4 bg-gray-700/20 border border-gray-600/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300">
                      {t('templateParametersVote')}
                    </h4>
                    <div className="space-y-4">
                      {PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate)?.parameterLabels.map((label, index) => {
                        const template = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate)!;
                        return (
                          <div key={index} className="space-y-2">
                            <Label htmlFor={`param-${index}`} className="text-gray-200 text-sm font-medium">{label}</Label>
                            <Input 
                              id={`param-${index}`}
                              placeholder={template.parameterPlaceholders[index]}
                              value={templateParameters[index] || ''}
                              onChange={(e) => updateTemplateParameter(index, e.target.value)}
                              disabled={isSubmitting}
                              className="bg-gray-800/30 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                            />
                            <p className="text-xs text-gray-400">{template.parameterDescriptions[index]}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Proposal Fields */}
                {isCustomProposal && (
                  <div className="space-y-4 bg-gray-700/20 border border-gray-600/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300">
                      {t('customContractInteraction')}
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="target" className="text-gray-200 text-sm font-medium">
                          {t('targetContractAddressVote')}
                        </Label>
                        <Input 
                          id="target" 
                          placeholder="0x..." 
                          value={targetAddress}
                          onChange={(e) => setTargetAddress(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-gray-800/30 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="function" className="text-gray-200 text-sm font-medium">
                          {t('functionSignatureVote')}
                        </Label>
                        <Input 
                          id="function" 
                          placeholder={t('exampleFunctionSignature')} 
                          value={functionSignature}
                          onChange={(e) => setFunctionSignature(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-gray-800/30 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="params" className="text-gray-200 text-sm font-medium">
                          {t('functionParametersCommaSeparated')}
                        </Label>
                        <Input 
                          id="params" 
                          placeholder={t('exampleFunctionParameter')} 
                          value={functionParams}
                          onChange={(e) => setFunctionParams(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-gray-800/30 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                        />
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
          <CardFooter className="pt-8 pb-8">
            <div className="flex items-center justify-center w-full">
              <Button 
                variant="default"
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateProposal();
                }}
                disabled={isSubmitting || !title || !description || (!isCustomProposal && !selectedTemplate)}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white font-semibold px-12 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg min-w-[200px] border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    {t('submittingProposal')}
                  </>
                ) : (
                  <>
                    <Plus className="mr-3 h-5 w-5" />
                    {t('createProposal')}
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 