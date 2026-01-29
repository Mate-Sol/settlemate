import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, TrendingUp, Wallet, FileText, LogOut, Copy, Check, DollarSign, ArrowUpRight, UserPlus, Loader2 } from 'lucide-react';
import FinancingStatsCard from '../../components/FinancingStatsCard';
import OrderBookTable from '../../components/OrderBookTable';
import ActiveFinancingTable from '../../components/ActiveFinancingTable';
import RequestFinancingModal from '../../components/RequestFinancingModal';
import RepayModal from '../../components/RepayModal';
import { pspAPI } from '../../services/api';

const PSPDashboard = () => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [poolStatus, setPoolStatus] = useState(null);

  // Financial data from backend/blockchain
  const [financialData, setFinancialData] = useState({
    totalLimit: 0,
    usedAmount: 0,
    availableAmount: 0,
  });

  // Wallet address from backend
  const walletAddress = profile?.walletAddress ? 
    `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-8)}` : 
    'Not assigned';
  const fullWalletAddress = profile?.walletAddress || '';

  // Order book data from backend
  const [orders, setOrders] = useState([]);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profile and order book in parallel
      const [profileResponse, orderBookResponse] = await Promise.all([
        pspAPI.getProfile(),
        pspAPI.getOrderBook()
      ]);

      setProfile(profileResponse.data);
      setOrders(orderBookResponse.data);

      // If credit line is approved, fetch pool status from blockchain
      if (profileResponse.data.creditLineStatus === 'Approved' && profileResponse.data.assignedPoolAddress) {
        try {
          const poolResponse = await pspAPI.getPoolStatus();
          setPoolStatus(poolResponse.data);
          
          // Update financial data from blockchain
          setFinancialData({
            totalLimit: parseFloat(poolResponse.data.creditLimit) || 0,
            usedAmount: parseFloat(poolResponse.data.utilizedAmount) || 0,
            availableAmount: parseFloat(poolResponse.data.remainingCredit) || 0,
          });
        } catch (poolError) {
          console.error('Failed to fetch pool status:', poolError);
          // Use approved amounts from profile if pool status fails
          setFinancialData({
            totalLimit: profileResponse.data.approvedAmount || 0,
            usedAmount: 0,
            availableAmount: profileResponse.data.approvedAmount || 0,
          });
        }
      } else if (profileResponse.data.creditLineStatus === 'Approved') {
        // Use approved amounts from profile
        setFinancialData({
          totalLimit: profileResponse.data.approvedAmount || 0,
          usedAmount: 0,
          availableAmount: profileResponse.data.approvedAmount || 0,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (fullWalletAddress) {
      navigator.clipboard.writeText(fullWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFinancingSubmit = async (data) => {
    try {
      // Call async financing API - returns immediately with requestId
      await pspAPI.requestFinancing({
        amount: data.amount,
        orderReference: data.orderReference,
      });
      
      // Refresh data after successful request
      await fetchDashboardData();
      
      // Clear selection
      setSelectedOrders([]);
    } catch (err) {
      console.error('Financing request failed:', err);
      throw err;
    }
  };

  const handleRepaySubmit = async (data) => {
    // Repay functionality would be implemented via smart contract
    // For now, simulate the repayment
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Refresh pool status after repayment
    await fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="btn-brand">
            Retry
          </button>
        </div>
      </div>
    );
  }

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

          {/* Active Financings Section */}
          <div className="mb-8">
            <ActiveFinancingTable />
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
            {/* <button 
              onClick={() => setShowRepayModal(true)}
              disabled={financialData.usedAmount === 0}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowUpRight className="w-5 h-5" />
              Repay
            </button> */}
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
