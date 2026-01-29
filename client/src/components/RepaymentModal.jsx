import { useEffect, useState } from 'react';
import { X, DollarSign, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { pspAPI } from '../services/api';

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

      // In a real implementation, PSP would call smart contract here
      // For now, we'll simulate with backend processing
      const response = await pspAPI.processRepayment({
        requestId: financing._id,
        principalAmount: financing.amount,
        actualInterestPaid: quote.expectedInterest,
        txHash: '0x' + Math.random().toString(16).substring(2, 66), // Mock tx hash
        blockNumber: Math.floor(Math.random() * 1000000)
      });

      setStep('complete');
      
      setTimeout(() => {
        onRepaymentSuccess(response.data);
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process repayment');
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
                    <span className="text-sm text-gray-600 block">Accrued Interest</span>
                    <span className="text-xs text-gray-500">
                      {quote.daysElapsed} days @ {quote.utilizedBips} bps/day
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatCurrency(quote.expectedInterest)}
                  </span>
                </div>

                {/* Total Due */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-purple to-brand-magenta rounded-lg text-white">
                  <div>
                    <span className="text-sm text-white/80 block">Total Due</span>
                    <span className="text-xs text-white/60">Principal + Interest</span>
                  </div>
                  <span className="text-2xl font-bold">{formatCurrency(quote.totalDue)}</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Important:</p>
                  <p className="text-xs">
                    In production, you would connect your wallet and call the <code className="bg-amber-100 px-1 rounded">repay()</code> function 
                    on the CreditLinePool contract. For demo purposes, clicking "Process Repayment" will simulate this transaction.
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
