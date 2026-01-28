import { useState } from 'react';
import { Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const OrderBookTable = ({ orders, selectedOrders, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredOrders = orders.filter(order => 
    order.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredOrders.map(o => o.id));
    }
  };

  const handleSelectOne = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      onSelectionChange(selectedOrders.filter(id => id !== orderId));
    } else {
      onSelectionChange([...selectedOrders, orderId]);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Pending': 'badge-warning',
      'Settled': 'badge-success',
      'Processing': 'badge-info',
      'Overdue': 'badge-danger',
    };
    return <span className={`badge ${statusStyles[status] || 'badge-info'}`}>{status}</span>;
  };

  return (
    <div className="table-container">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold">Order Book</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell w-12">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                />
              </th>
              <th className="table-cell text-left">Reference ID</th>
              <th className="table-cell text-left">Customer</th>
              <th className="table-cell text-left">Amount</th>
              <th className="table-cell text-left">Date</th>
              <th className="table-cell text-left">Settlement Date</th>
              <th className="table-cell text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr 
                key={order.id} 
                className={`table-row cursor-pointer ${selectedOrders.includes(order.id) ? 'bg-brand-purple/5' : ''}`}
                onClick={() => handleSelectOne(order.id)}
              >
                <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleSelectOne(order.id)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                  />
                </td>
                <td className="table-cell font-mono text-sm">{order.referenceId}</td>
                <td className="table-cell font-medium">{order.customer}</td>
                <td className="table-cell font-semibold">{formatCurrency(order.amount)}</td>
                <td className="table-cell text-gray-500">{formatDate(order.date)}</td>
                <td className="table-cell text-gray-500">{formatDate(order.settlementDate)}</td>
                <td className="table-cell">{getStatusBadge(order.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No orders found matching your search.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 text-sm font-medium">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {selectedOrders.length > 0 && (
        <div className="px-6 py-3 bg-brand-purple/5 border-t border-brand-purple/20 flex items-center justify-between">
          <span className="text-sm font-medium text-brand-purple">
            <Check className="w-4 h-4 inline mr-1" />
            {selectedOrders.length} order(s) selected
          </span>
          <span className="text-sm font-semibold text-brand-purple">
            Total: {formatCurrency(orders.filter(o => selectedOrders.includes(o.id)).reduce((sum, o) => sum + o.amount, 0))}
          </span>
        </div>
      )}
    </div>
  );
};

export default OrderBookTable;
