import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, TrendingUp, Wallet, FileText, LogOut, Copy, Check, DollarSign, ArrowUpRight, UserPlus } from 'lucide-react';
import FinancingStatsCard from '../../components/FinancingStatsCard';
import OrderBookTable from '../../components/OrderBookTable';
import RequestFinancingModal from '../../components/RequestFinancingModal';
import RepayModal from '../../components/RepayModal';

const PSPDashboard = () => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);

  // Mock financial data - would come from DeFa protocol in production
  const [financialData, setFinancialData] = useState({
    totalLimit: 500000,
    usedAmount: 120000,
    availableAmount: 380000,
  });

  // Mock wallet address assigned to this PSP
  const walletAddress = '0x1234...5678AbCd';
  const fullWalletAddress = '0x1234567890AbCdEf1234567890AbCdEf12345678';

  // Mock order book data
  const [orders] = useState([
    { id: 1, referenceId: 'ORD-2026-001', customer: 'TechCorp Inc', amount: 25000, date: '2026-01-25', settlementDate: '2026-02-24', status: 'Pending' },
    { id: 2, referenceId: 'ORD-2026-002', customer: 'Global Retail', amount: 45000, date: '2026-01-24', settlementDate: '2026-02-23', status: 'Pending' },
    { id: 3, referenceId: 'ORD-2026-003', customer: 'FastShip LLC', amount: 18000, date: '2026-01-23', settlementDate: '2026-02-22', status: 'Processing' },
    { id: 4, referenceId: 'ORD-2026-004', customer: 'Metro Services', amount: 32000, date: '2026-01-22', settlementDate: '2026-02-21', status: 'Settled' },
    { id: 5, referenceId: 'ORD-2026-005', customer: 'DigiPay Corp', amount: 55000, date: '2026-01-21', settlementDate: '2026-02-20', status: 'Pending' },
    { id: 6, referenceId: 'ORD-2026-006', customer: 'CloudBase Inc', amount: 28000, date: '2026-01-20', settlementDate: '2026-02-19', status: 'Pending' },
    { id: 7, referenceId: 'ORD-2026-007', customer: 'NextGen Ltd', amount: 42000, date: '2026-01-19', settlementDate: '2026-02-18', status: 'Processing' },
    { id: 8, referenceId: 'ORD-2026-008', customer: 'Swift Trade', amount: 15000, date: '2026-01-18', settlementDate: '2026-02-17', status: 'Overdue' },
    { id: 9, referenceId: 'ORD-2026-009', customer: 'Prime Goods', amount: 38000, date: '2026-01-17', settlementDate: '2026-02-16', status: 'Settled' },
    { id: 10, referenceId: 'ORD-2026-010', customer: 'DataFlow Inc', amount: 22000, date: '2026-01-16', settlementDate: '2026-02-15', status: 'Pending' },
    { id: 11, referenceId: 'ORD-2026-011', customer: 'QuickMart', amount: 19000, date: '2026-01-15', settlementDate: '2026-02-14', status: 'Pending' },
    { id: 12, referenceId: 'ORD-2026-012', customer: 'BlockChain Co', amount: 67000, date: '2026-01-14', settlementDate: '2026-02-13', status: 'Processing' },
  ]);

  const copyAddress = () => {
    navigator.clipboard.writeText(fullWalletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinancingSubmit = async (data) => {
    // Simulate API/blockchain call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update financial data (simulate disbursement)
    setFinancialData(prev => ({
      ...prev,
      usedAmount: prev.usedAmount + data.amount,
      availableAmount: prev.availableAmount - data.amount,
    }));
    
    // Clear selection
    setSelectedOrders([]);
  };

  const handleRepaySubmit = async (data) => {
    // Simulate API/blockchain call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update financial data (simulate repayment)
    setFinancialData(prev => ({
      ...prev,
      usedAmount: Math.max(0, prev.usedAmount - data.amount),
      availableAmount: Math.min(prev.totalLimit, prev.availableAmount + data.amount),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            <span className="text-xl font-bold">CredMate</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <a href="/psp/dashboard" className="sidebar-link active">
            <TrendingUp className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/psp/order-book" className="sidebar-link">
            <FileText className="w-5 h-5" />
            Order Book
          </a>
          <a href="/psp/wallet" className="sidebar-link">
            <Wallet className="w-5 h-5" />
            Wallet
          </a>
           <a href="/psp/onboarding" className="sidebar-link">
            <UserPlus className="w-5 h-5" />
            Profile
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button 
            onClick={logout}
            className="sidebar-link w-full justify-start text-white/60 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="page-header mb-1">Welcome, {user?.name}</h1>
              <p className="text-gray-600">Manage your credit line and financing requests</p>
            </div>
            
            {/* Wallet Display */}
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-gradient rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Assigned Wallet</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{walletAddress}</code>
                  <button 
                    onClick={copyAddress}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy full address"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Stats Card with Gauge */}
          <div className="mb-8">
            <FinancingStatsCard 
              totalLimit={financialData.totalLimit}
              usedAmount={financialData.usedAmount}
              availableAmount={financialData.availableAmount}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setShowFinancingModal(true)}
              disabled={selectedOrders.length === 0}
              className="btn-brand flex items-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Request Financing
              {selectedOrders.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                  {selectedOrders.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setShowRepayModal(true)}
              disabled={financialData.usedAmount === 0}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowUpRight className="w-5 h-5" />
              Repay
            </button>
          </div>

          {/* Order Book Table */}
          <OrderBookTable 
            orders={orders}
            selectedOrders={selectedOrders}
            onSelectionChange={setSelectedOrders}
          />
        </div>
      </main>

      {/* Modals */}
      <RequestFinancingModal 
        isOpen={showFinancingModal}
        onClose={() => setShowFinancingModal(false)}
        selectedOrders={selectedOrders}
        orders={orders}
        availableLimit={financialData.availableAmount}
        onSubmit={handleFinancingSubmit}
      />

      <RepayModal 
        isOpen={showRepayModal}
        onClose={() => setShowRepayModal(false)}
        usedAmount={financialData.usedAmount}
        onSubmit={handleRepaySubmit}
      />
    </div>
  );
};

export default PSPDashboard;
