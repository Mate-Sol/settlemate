import { useState, useEffect } from 'react';
import { Clock, DollarSign, Calendar, TrendingUp, CheckCircle, XCircle, Loader2, RefreshCw, Hash, ExternalLink, Banknote } from 'lucide-react';
import RepaymentModal from './RepaymentModal';

const ActiveFinancingTable = () => {
  const [financings, setFinancings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repaymentModal, setRepaymentModal] = useState({ isOpen: false, financing: null });

  const fetchFinancings = async () => {
    try {
      setLoading(true);
      const { pspAPI } = await import('../services/api');
      const response = await pspAPI.getActiveFinancings();
      setFinancings(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch financings:', err);
      setError('Failed to load financing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancings();
    // Auto-refresh every 5 seconds for pending statuses
    const interval = setInterval(() => {
      fetchFinancings();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
      Validated: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Clock className="w-4 h-4" /> },
      Disbursed: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      Repaid: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <CheckCircle className="w-4 h-4" /> },
      Rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-4 h-4" /> },
      Failed: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-4 h-4" /> },
    };

    const badge = badges[status] || badges.Pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status}
      </span>
    );
  };

  if (loading && financings.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-purple" />
        <p className="text-gray-600">Loading active financings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchFinancings} className="btn-secondary">
          Try Again
        </button>
      </div>
    );
  }

  if (financings.length === 0) {
    return (
      <div className="card p-8 text-center">
        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Financings</h3>
        <p className="text-gray-500">Request financing from your order book to get started</p>
      </div>
    );
  }

  return (
  <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Active Financings</h2>
        <button 
          onClick={fetchFinancings}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Responsive Implementation:
        1. Mobile View (Hidden on md screens)
        2. Desktop View (Hidden on small screens)
      */}

      {/* --- MOBILE VIEW (CARDS) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {financings.map((financing) => (
          <div key={financing._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
            
            {/* Card Header: Ref & Status */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Order Ref</span>
                <div className="font-mono text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-gray-400" />
                  {financing?.orderReference}
                </div>
              </div>
              {getStatusBadge(financing.status)}
            </div>

            {/* Main Value */}
            <div>
              <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Amount</span>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(financing.amount)}</div>
            </div>

            {/* Grid for Details */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-b border-gray-100 py-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Date Issued</span>
                <span className="text-sm">{formatDate(financing.disbursedAt || financing.createdAt)}</span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 block mb-1">Duration</span>
                 {financing.status === 'Disbursed' ? (
                  <span className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {financing.daysElapsed || 0} days
                  </span>
                ) : <span className="text-gray-400 text-sm">-</span>}
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">Accrued Interest</span>
                {financing.status === 'Disbursed' && financing.accruedInterest ? (
                  <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                    <TrendingUp className="w-3 h-3" />
                    {formatCurrency(financing.accruedInterest.total)}
                  </div>
                ) : <span className="text-sm text-gray-400">-</span>}
              </div>

               <div>
                <span className="text-xs text-gray-500 block mb-1">Utilization</span>
                {financing.status === 'Disbursed' ? (
                  <div className="text-sm">
                    {financing.utilizedBips || 0} <span className="text-gray-400 text-xs">bps</span>
                  </div>
                ) : <span className="text-sm text-gray-400">-</span>}
              </div>
            </div>

            {/* Footer: Transaction Link */}
            {financing.txHash && (
               <a
                href={`https://sepolia.etherscan.io/tx/${financing.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm text-indigo-600 transition-colors"
              >
                <span className="font-mono text-xs">{financing.txHash.substring(0, 16)}...</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {financing.rejectionReason && (
               <div className="p-2 bg-red-50 text-red-700 text-sm rounded">
                 {financing.rejectionReason}
               </div>
            )}
          </div>
        ))}
      </div>

      {/* --- DESKTOP VIEW (TABLE) --- */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Order Reference</th>
                <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Date Issued</th>
                <th className="px-6 py-4 whitespace-nowrap">Days Elapsed</th>
                <th className="px-6 py-4 whitespace-nowrap">Interest (BIPS)</th>
                <th className="px-6 py-4 whitespace-nowrap">Accrued Interest</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Transaction</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {financings.map((financing) => (
                <tr key={financing._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono">{financing?.orderReference}</td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(financing.amount)}</td>
                  <td className="px-6 py-4">{getStatusBadge(financing.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(financing.disbursedAt || financing.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {financing.status === 'Disbursed' ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {financing.daysElapsed || 0} days
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {financing.status === 'Disbursed' ? (
                      <div>
                        <div><span className="font-medium">{financing.utilizedBips || 0}</span> <span className="text-xs text-gray-500">used</span></div>
                        <div className="text-xs text-gray-400">{financing.unutilizedBips || 0} unused</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {financing.status === 'Disbursed' && financing.accruedInterest ? (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <TrendingUp className="w-4 h-4" />
                        {formatCurrency(financing.accruedInterest.total)}
                      </div>
                    ) : financing.status === 'Rejected' || financing.status === 'Failed' ? (
                      <span className="text-red-600 text-xs max-w-[150px] truncate block" title={financing.rejectionReason}>
                        {financing.rejectionReason || financing.failureReason}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Processing...</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {financing.txHash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${financing.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-mono inline-flex items-center gap-1"
                      >
                        {financing.txHash.substring(0, 6)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {financing.status === 'Disbursed' ? (
                      <button
                        onClick={() => setRepaymentModal({ isOpen: true, financing })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-purple text-white text-xs font-medium rounded hover:bg-opacity-90 transition-colors"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        Repay
                      </button>
                    ) : financing.status === 'Repaid' ? (
                      <span className="text-xs text-purple-600 font-medium">✓ Repaid</span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repayment Modal */}
      <RepaymentModal
        isOpen={repaymentModal.isOpen}
        onClose={() => setRepaymentModal({ isOpen: false, financing: null })}
        financing={repaymentModal.financing}
        onRepaymentSuccess={() => {
          fetchFinancings(); // Refresh table
          setRepaymentModal({ isOpen: false, financing: null });
        }}
      />
    </div>
  );
};

export default ActiveFinancingTable;
