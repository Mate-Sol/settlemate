import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, BarChart3, PieChart as PieChartIcon, TrendingUp, LogOut, DollarSign, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cfoAPI } from '../../../services/api';
import CFOFinancingsTable from '../../../components/CFOFinancingsTable';

const CFODashboard = () => {
  const { user, logout } = useAuth();
  
  // State for backend data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPSPs: 0,
    totalApprovedCredit: 0,
    totalActiveCredit: 0,
    totalFinancings: 0,
    pendingApplications: 0,
    totalInterestRevenue: 0
  });
  const [yieldData, setYieldData] = useState([]);
  const [financings, setFinancings] = useState([]);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats, yield history, and all financings
      const [statsResponse, yieldResponse, financingsResponse] = await Promise.all([
        cfoAPI.getDashboardStats(),
        cfoAPI.getYieldHistory(),
        cfoAPI.getAllFinancings()
      ]);

      setStats(statsResponse.data);
      setYieldData(yieldResponse.data);
      setFinancings(financingsResponse.data.financings);
    } catch (err) {
      console.error('Failed to fetch CFO dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for exposure distribution (will be updated)
  const exposureData = [
    { name: 'Active Loans', value: stats.totalActiveCredit, color: '#10b981' },
    { name: 'Available Liquidity', value: stats.totalApprovedCredit - stats.totalActiveCredit, color: '#6366f1' },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading CFO Dashboard...</p>
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
          <span className="text-xs text-white/60 mt-1 block">CFO Admin</span>
        </div>
        
        <nav className="p-4 space-y-2">
          <a href="/admin/cfo" className="sidebar-link active">
            <BarChart3 className="w-5 h-5" />
            Treasury Overview
          </a>
          <a href="/admin/cfo/exposure" className="sidebar-link">
            <PieChartIcon className="w-5 h-5" />
            Exposure Analysis
          </a>
          <a href="/admin/cfo/yields" className="sidebar-link">
            <TrendingUp className="w-5 h-5" />
            Yield Reports
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
            <h1 className="page-header">CFO Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name} - Treasury & Yield Overview (Read-Only)</p>
          </header>

          {/* Treasury Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="stats-card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-brand-purple" />
                <span className="stats-label">Total Approved Credit</span>
              </div>
              <span className="stats-value text-gradient">{formatCurrency(stats.totalApprovedCredit)}</span>
            </div>
            <div className="stats-card">
              <span className="stats-label">Total Active Credit</span>
              <span className="stats-value text-status-warning">{formatCurrency(stats.totalActiveCredit)}</span>
            </div>
            <div className="stats-card">
              <span className="stats-label">Active Financings</span>
              <span className="stats-value text-status-success">{stats.totalFinancings}</span>
            </div>
            <div className="stats-card">
              <span className="stats-label">Interest Revenue (YTD)</span>
              <span className="stats-value">{formatCurrency(stats.totalInterestRevenue)}</span>
            </div>
          </div>

          {/* Active Financings Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Active Financings (All PSPs)</h2>
            <CFOFinancingsTable financings={financings} />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Exposure Distribution Pie Chart */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Exposure Distribution</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={exposureData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {exposureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Yield Trends */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Monthly Yield Trends</h2>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={yieldData}>
                  <defs>
                    <linearGradient id="colorUtilized" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUnutilized" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="utilized" stroke="#10b981" fillOpacity={1} fill="url(#colorUtilized)" name="Utilized Yield" />
                  <Area type="monotone" dataKey="unutilized" stroke="#6366f1" fillOpacity={1} fill="url(#colorUnutilized)" name="Unutilized Yield" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yield Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Yield Generation</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Utilized Rate (Active Loans)</p>
                    <p className="text-lg font-semibold">5 bps/day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Monthly Yield</p>
                    <p className="text-lg font-semibold text-status-success">$187,500</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Unutilized Rate (Idle)</p>
                    <p className="text-lg font-semibold">1 bps/day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Monthly Yield</p>
                    <p className="text-lg font-semibold text-status-info">$39,900</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-brand-purple to-brand-magenta rounded-lg text-white">
                  <div>
                    <p className="text-sm text-white/80">Total Monthly Yield</p>
                    <p className="text-xl font-bold">$227,400</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/80">Annualized Return</p>
                    <p className="text-xl font-bold">10.56%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Pool Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">Active Vaults</span>
                  <span className="text-xl font-bold text-green-800">45</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                  <span className="font-medium text-amber-800">Pending Closure</span>
                  <span className="text-xl font-bold text-amber-800">3</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                  <span className="font-medium text-gray-800">Closed This Month</span>
                  <span className="text-xl font-bold text-gray-800">8</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <span className="font-medium text-purple-800">Total Vaults (All-Time)</span>
                  <span className="text-xl font-bold text-purple-800">156</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CFODashboard;
