import { useEffect, useState } from 'react';
import { X, DollarSign, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { pspAPI } from '../services/api';

const poolABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_admin",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_pspWallet",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_usdDFToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_creditLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_duration",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_utilizedBips",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_unutilizedBips",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "pspWallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "creditLimit",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "name": "CreditLineActivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CreditLineClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "pspWallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "referenceId",
        "type": "string"
      }
    ],
    "name": "Drawdown",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "utilizedFees",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "unutilizedFees",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "FeesCollected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "pspWallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "principal",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "actualInterest",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expectedInterest",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "Repayment",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "calculateInterest",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "calculateUnutilizedFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "closeCreditLine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "collectFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creditLimit",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deploymentTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "referenceId",
        "type": "string"
      }
    ],
    "name": "drawdown",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "duration",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "expiryTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "fundPool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolStatus",
    "outputs": [
      {
        "internalType": "address",
        "name": "_pspWallet",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_creditLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_utilizedAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_remainingCredit",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "_daysRemaining",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_poolBalance",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRemainingCredit",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokenAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isActive",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pauseCreditLine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pspWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reactivateCreditLine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "principal",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "interestAmount",
        "type": "uint256"
      }
    ],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unutilizedBips",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdDF",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "utilizedAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "utilizedBips",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const RepaymentModal = ({ isOpen, onClose, financing, onRepaymentSuccess }) => {
  console.log(financing);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('quote'); // 'quote' | 'processing' | 'complete'



  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pspAPI.getRepaymentQuote(financing._id);
      setQuote(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load repayment quote');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRepayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setStep('processing');

      console.log('[Repayment Modal] Processing repayment for:', financing._id);
      console.log('[Repayment Modal] Principal:', financing.amount);
      console.log('[Repayment Modal] Expected Interest:', quote.expectedInterest);

      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const { ethers } = await import('ethers');

      // Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // 2. Define Sepolia Chain ID (11155111 in hex is 0xaa36a7)
      const SEPOLIA_CHAIN_ID = "0xaa36a7";

      // 3. Check current network and switch if necessary
      const network = await provider.getNetwork();
      // ethers v6 returns chainId as a BigInt, so we compare strictly
      if (network.chainId !== 11155111n) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError) {
          // This error code 4902 indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: SEPOLIA_CHAIN_ID,
                    chainName: "Sepolia Test Network",
                    nativeCurrency: {
                      name: "Sepolia ETH",
                      symbol: "SepoliaETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"], // Or public RPCs like https://rpc.sepolia.org
                    blockExplorerUrls: ["https://sepolia.etherscan.io"],
                  },
                ],
              });
            } catch (addError) {
              console.error("Failed to add Sepolia network:", addError);
              throw new Error("Could not add Sepolia network to wallet.");
            }
          } else {
            console.error("Failed to switch to Sepolia:", switchError);
            throw new Error("Please switch your wallet to the Sepolia network.");
          }
        }
      }

      console.log('[Repayment Modal] Connected wallet:', userAddress);

      // Contract ABIs (minimal)
      const usddfABI = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address owner) view returns (uint256)"
      ];



      // Get contract addresses from quote
      const poolAddress = quote.poolAddress;
      const usddfAddress = import.meta.env.VITE_USDDF_TOKEN_ADDRESS || '0x...'; // You'll need to add this to .env



      console.log('[Repayment Modal] Approving USD-DF spend...');

      // Step 1: Approve USD-DF token
      const usddf = new ethers.Contract(usddfAddress, usddfABI, signer);
      // const approveTx = await usddf.approve(poolAddress, totalAmount);
      // await approveTx.wait();





      // Step 2: Call repay on pool
      const poolContract = new ethers.Contract(poolAddress, poolABI, signer);
      // 2. DEBUG: Verify Wallet & Debt
      const registeredWallet = await poolContract.pspWallet();
      const currentDebt = await poolContract.utilizedAmount();

      console.log("Registered Wallet:", registeredWallet, userAddress);

      if (registeredWallet.toLowerCase() !== userAddress.toLowerCase()) {
        alert(`WRONG WALLET! Contract expects: ${registeredWallet}`);
        return;
      }
      // 3. Format Numbers (Handling Decimals)
      const decimals = await usddf.decimals();

      // Convert Principal (e.g. 10000) -> BigInt
      const _principalWei = ethers.parseUnits(quote.principal.toString(), decimals);

      // Convert Interest (e.g. 0.15) -> BigInt
      // Note: Ensure interestAmount matches the format your backend provided
      const _interestWei = ethers.parseUnits(quote.expectedInterest.toString(), decimals);

      // Calculate TOTAL needed for approval
      const totalRepaymentWei = _principalWei + _interestWei;

      console.log(`Principal: ${_principalWei}`);
      console.log(`Interest: ${_interestWei}`);
      console.log(`Total Needed: ${totalRepaymentWei}`);
      console.log(`Total currentDebt: ${currentDebt}`);

      const currentAllowance = await usddf.allowance(userAddress, poolAddress);
      const pspWallet = await poolContract.pspWallet();
      const allowance = await usddf.allowance(pspWallet, poolAddress);
      const balance = await usddf.balanceOf(pspWallet);

      console.log("PSP Wallet:", pspWallet);
      console.log("Allowance (psp → pool):", allowance.toString());
      console.log("Balance (psp):", balance.toString());
      console.log("Total Needed:", totalRepaymentWei.toString());

      if (currentAllowance < totalRepaymentWei) {
        console.log("Insufficient allowance. Approving...");
        const approveTx = await usddf.approve(poolAddress, totalRepaymentWei);
        await approveTx.wait();
        console.log("Approval confirmed:", approveTx.hash);
        const _currentAllowance = await usddf.allowance(userAddress, poolAddress);
        console.log("Current allowance:", _currentAllowance);

      }
      const repayTx = await poolContract.repay(_principalWei, _interestWei);
      // return
      console.log('[Repayment Modal] Waiting for repayment confirmation...');
      const receipt = await repayTx.wait();

      console.log('[Repayment Modal] Blockchain transaction successful:', repayTx.hash);

      // Step 3: Send transaction hash to backend for record keeping
      const response = await pspAPI.processRepayment({
        requestId: financing._id,
        principalAmount: financing.amount,
        actualInterestPaid: quote.expectedInterest,
        txHash: repayTx.hash,
        blockNumber: receipt.blockNumber
      });

      console.log('[Repayment Modal] Backend updated:', response.data);

      setStep('complete');

      setTimeout(() => {
        onRepaymentSuccess(response.data);
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('[Repayment Modal] Error:', err);
      let errorMessage = 'Failed to process repayment';

      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message?.includes('MetaMask')) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setStep('quote');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('quote');
    setQuote(null);
    setError(null);
    onClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  // Load repayment quote when modal opens
  useEffect(() => {
    if (isOpen && financing._id) {
      loadQuote();
    }
  }, [isOpen, financing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Repay Financing</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading && step === 'processing'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Quote Step */}
          {step === 'quote' && quote && (
            <>
              <div className="space-y-4 mb-6">
                {/* Order Reference */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Order Reference</span>
                  <span className="font-mono text-sm font-semibold">{quote.orderReference}</span>
                </div>

                {/* Principal Amount */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Principal Amount</span>
                  <span className="text-lg font-bold">{formatCurrency(quote.principal)}</span>
                </div>

                {/* Interest Details */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600 block"> Interest (Utilized)</span>
                    <span className="text-xs text-gray-500">
                      {quote.daysElapsed} days @ {quote.utilizedBips} bps/day
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatCurrency(quote.expectedInterest)}
                  </span>
                </div>

                {/* Note about Maintenance Fees */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-800 font-medium">Credit Line Maintenance Fees</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Maintenance fees are billed separately on a weekly basis. Check the "Credit Line Maintenance" section on your dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Due */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-purple to-brand-magenta rounded-lg text-white">
                  <div>
                    <span className="text-sm text-white/80 block">Total Due</span>
                    <span className="text-xs text-white/60">Principal + Loan Interest</span>
                  </div>
                  <span className="text-2xl font-bold">{formatCurrency(quote.totalDue)}</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Wallet Connection Required:</p>
                  <p className="text-xs">
                    Clicking "Process Repayment" will connect your MetaMask wallet and execute two transactions:
                    <br />1. Approve USD-DF token spend
                    <br />2. Call <code className="bg-blue-100 px-1 rounded">repay()</code> on your CreditLinePool
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              <button
                onClick={handleProcessRepayment}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Process Repayment
                  </>
                )}
              </button>
            </>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Repayment</h3>
              <p className="text-gray-600 text-sm">
                Updating credit line and creating repayment record...
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-600">Repayment Successful!</h3>
              <p className="text-gray-600 text-sm mb-4">
                Your credit line has been restored.
              </p>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">{formatCurrency(quote.principal)}</span> added back to available credit
                </p>
              </div>
            </div>
          )}

          {/* Loading Quote */}
          {loading && !quote && step === 'quote' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-3 border-gray-300 border-t-brand-purple rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Loading repayment quote...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepaymentModal;
