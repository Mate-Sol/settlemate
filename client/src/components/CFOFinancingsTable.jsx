import { DollarSign, Calendar, TrendingUp, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

const CFOFinancingsTable = ({ financings }) => {
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

  if (!financings || financings.length === 0) {
    return (
      <div className="card p-8 text-center">
        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Financings</h3>
        <p className="text-gray-500">No PSP financing activity yet</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>PSP Company</th>
              <th>Order Reference</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date Issued</th>
              <th>Days Elapsed</th>
              <th>Accrued Interest</th>
              <th className="text-right">TX Hash</th>
            </tr>
          </thead>
          <tbody>
            {financings.map((financing) => (
              <tr key={financing._id}>
                <td className="font-semibold">{financing.pspId?.companyName || 'Unknown PSP'}</td>
                <td className="font-mono text-sm">{financing.orderReference}</td>
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
  );
};

export default CFOFinancingsTable;
