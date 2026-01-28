import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, TrendingUp, Wallet as WalletIcon, FileText, LogOut, UserPlus, Copy, Check, ExternalLink, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const Wallet = () => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  // Mock wallet data
  const walletAddress = '0x1234567890AbCdEf1234567890AbCdEf12345678';
  const shortAddress = '0x1234...5678';
  const balance = 380000; // Available USDC

  // Mock transaction history
  const transactions = [
    { id: 1, type: 'Disbursement', amount: 50000, date: '2026-01-25', txHash: '0xabc...123', status: 'Confirmed' },
    { id: 2, type: 'Repayment', amount: 30000, date: '2026-01-20', txHash: '0xdef...456', status: 'Confirmed' },
    { id: 3, type: 'Disbursement', amount: 100000, date: '2026-01-15', txHash: '0xghi...789', status: 'Confirmed' },
  ];

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
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
          <a href="/psp/dashboard" className="sidebar-link">
            <TrendingUp className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/psp/order-book" className="sidebar-link">
            <FileText className="w-5 h-5" />
            Order Book
          </a>
          <a href="/psp/wallet" className="sidebar-link active">
            <WalletIcon className="w-5 h-5" />
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
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="page-header">Wallet</h1>
            <p className="text-gray-600">Your assigned EVM wallet for fund disbursement</p>
          </header>

          {/* Wallet Card */}
          <div className="card bg-brand-gradient text-white mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/70 text-sm">Wallet Address</p>
                <div className="flex items-center gap-3 mt-1">
                  <code className="text-lg font-mono">{shortAddress}</code>
                  <button 
                    onClick={copyAddress}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy full address"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <a 
                    href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="View on Etherscan"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">Available Balance</p>
                <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
                <p className="text-sm text-white/70">USDC</p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
            <div className="space-y-4">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'Disbursement' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {tx.type === 'Disbursement' ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.type}</p>
                      <p className="text-sm text-gray-500">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'Disbursement' ? 'text-green-600' : 'text-blue-600'}`}>
                      {tx.type === 'Disbursement' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-purple hover:underline"
                    >
                      View on Etherscan
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Wallet;
