import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, TrendingUp, Wallet, FileText, LogOut, UserPlus } from 'lucide-react';
import OrderBookTable from '../../components/OrderBookTable';

const OrderBook = () => {
  const { user, logout } = useAuth();
  const [selectedOrders, setSelectedOrders] = useState([]);

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
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src={"/logo-white.png"} alt="logo" className='h-20 ' />
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <a href="/psp/dashboard" className="sidebar-link">
            <TrendingUp className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/psp/order-book" className="sidebar-link active">
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
          <header className="mb-8">
            <h1 className="page-header">Order Book</h1>
            <p className="text-gray-600">View and manage your settlement data</p>
          </header>

          <OrderBookTable 
            orders={orders}
            selectedOrders={selectedOrders}
            onSelectionChange={setSelectedOrders}
          />
        </div>
      </main>
    </div>
  );
};

export default OrderBook;
