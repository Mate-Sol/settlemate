import { useState, useEffect } from 'react';
import { Clock, DollarSign, Calendar, TrendingUp, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

const ActiveFinancingTable = () => {
  const [financings, setFinancings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const hasPending = financings.some(f => f.status === 'Pending' || f.status === 'Validated');
      if (hasPending) {
        fetchFinancings();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [financings]);

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Active Financings</h2>
        <button 
          onClick={fetchFinancings}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date Issued</th>
                <th>Days Elapsed</th>
                <th>Interest (BIPS)</th>
                <th>Accrued Interest</th>
                <th className="text-right">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {financings.map((financing) => (
                <tr key={financing._id}>
                  <td className="font-mono text-sm">{financing.orderBookReferenceIds[0]}</td>
                  <td className="font-semibold">{formatCurrency(financing.amount)}</td>
                  <td>{getStatusBadge(financing.status)}</td>
                  <td>{formatDate(financing.disbursedAt || financing.createdAt)}</td>
                  <td>
                    {financing.status === 'Disbursed' ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {financing.daysElapsed || 0} days
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    {financing.status === 'Disbursed' ? (
                      <div className="text-sm">
                        <div>Utilized: {financing.utilizedBips || 0} bps</div>
                        <div className="text-gray-500">Unutilized: {financing.unutilizedBips || 0} bps</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    {financing.status === 'Disbursed' && financing.accruedInterest ? (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <TrendingUp className="w-4 h-4" />
                        {formatCurrency(financing.accruedInterest.total)}
                      </div>
                    ) : financing.status === 'Rejected' || financing.status === 'Failed' ? (
                      <span className="text-red-600 text-sm">{financing.rejectionReason || financing.failureReason}</span>
                    ) : (
                      <span className="text-gray-400">Processing...</span>
                    )}
                  </td>
                  <td className="text-right">
                    {financing.txHash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${financing.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-purple hover:underline text-sm font-mono"
                      >
                        {financing.txHash.substring(0, 8)}...
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActiveFinancingTable;
