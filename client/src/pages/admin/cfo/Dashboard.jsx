import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, BarChart3, PieChart as PieChartIcon, TrendingUp, LogOut, DollarSign, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cfoAPI } from '../../../services/api';
import CFOFinancingsTable from '../../../components/CFOFinancingsTable';
import EarnedYieldChart from '../../../components/EarnedYieldChart';


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
  const [yieldAnalytics, setYieldAnalytics] = useState(null);


  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats, yield history, and all financings
      const [statsResponse, yieldResponse, financingsResponse, analyticsResponse] = await Promise.all([
        cfoAPI.getDashboardStats(),
        cfoAPI.getYieldHistory(),
        cfoAPI.getAllFinancings(),
        cfoAPI.getYieldAnalytics()
      ]);

      setStats(statsResponse.data);
      setYieldData(yieldResponse.data);
      setFinancings(financingsResponse.data.financings);
      setYieldAnalytics(analyticsResponse.data);
    } catch (err) {
      console.error('Failed to fetch CFO dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for exposure distribution (will be updated)
  const exposureData = [
    { name: 'Active Liquidity', value: stats.totalActiveCredit, color: '#10b981' },
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
          <a href="/admin/cfo/repayments" className="sidebar-link">
            <DollarSign className="w-5 h-5" />
            Repayment Monitoring
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



          {/* Yield Performance Analytics */}
          {yieldAnalytics && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold mb-6">Yield Performance</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Expected Yield */}
                <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-blue-600 font-medium mb-1">Expected Yield (Accrued)</p>
                      <p className="text-xs text-blue-500/70">Based on BIPS & days elapsed</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700 mb-2">
                    {formatCurrency(yieldAnalytics.accruedYield.total)}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-blue-600">
                      <span className="font-semibold">{formatCurrency(yieldAnalytics.accruedYield.utilized)}</span> utilized
                    </span>
                    <span className="text-blue-500">
                      <span className="font-semibold">{formatCurrency(yieldAnalytics.accruedYield.unutilized)}</span> idle
                    </span>
                  </div>
                </div>

                {/* Realized Yield */}
                <div className="p-5 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-green-600 font-medium mb-1">Realized Yield (Collected)</p>
                      <p className="text-xs text-green-500/70">Actual interest received</p>
                    </div>
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-green-700 mb-2">
                    {formatCurrency(yieldAnalytics.realizedYield.totalInterestReceived)}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600">
                      From <span className="font-semibold">{yieldAnalytics.realizedYield.totalRepayments}</span> repayments
                    </span>
                  </div>
                </div>

                {/* Collection Rate & Variance */}
                <div className={`p-5 rounded-lg border ${yieldAnalytics.variance.status === 'over_target' ? 'bg-emerald-50 border-emerald-100' :
                  yieldAnalytics.variance.status === 'under_target' ? 'bg-amber-50 border-amber-100' :
                    'bg-gray-50 border-gray-100'
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`text-sm font-medium mb-1 ${yieldAnalytics.variance.status === 'over_target' ? 'text-emerald-600' :
                        yieldAnalytics.variance.status === 'under_target' ? 'text-amber-600' :
                          'text-gray-600'
                        }`}>Collection Rate</p>
                      <p className="text-xs text-gray-500">Realized / Expected</p>
                    </div>
                    <BarChart3 className={`w-5 h-5 ${yieldAnalytics.variance.status === 'over_target' ? 'text-emerald-500' :
                      yieldAnalytics.variance.status === 'under_target' ? 'text-amber-500' :
                        'text-gray-500'
                      }`} />
                  </div>
                  <p className={`text-3xl font-bold mb-2 ${yieldAnalytics.variance.status === 'over_target' ? 'text-emerald-700' :
                    yieldAnalytics.variance.status === 'under_target' ? 'text-amber-700' :
                      'text-gray-700'
                    }`}>
                    {yieldAnalytics.revenueRate.toFixed(1)}%
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={
                      yieldAnalytics.variance.status === 'over_target' ? 'text-emerald-600' :
                        yieldAnalytics.variance.status === 'under_target' ? 'text-amber-600' :
                          'text-gray-600'
                    }>
                      Variance: <span className="font-semibold">
                        {yieldAnalytics.variance.amount >= 0 ? '+' : ''}{formatCurrency(yieldAnalytics.variance.amount)}
                      </span>
                      {' '}({yieldAnalytics.variance.percentage >= 0 ? '+' : ''}{yieldAnalytics.variance.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUnutilized" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
            {/* <div className="card">
              <h2 className="text-xl font-semibold mb-4">Yield Generation</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Utilized Rate (Active Loans)</p>
                    <p className="text-lg font-semibold">5 bps/day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Monthly Yield</p>
                    <p className="text-lg font-semibold text-status-success">
                      {formatCurrency(yieldData.length > 0 ? yieldData[yieldData.length - 1].utilized : 0)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Unutilized Rate (Idle)</p>
                    <p className="text-lg font-semibold">1 bps/day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Monthly Yield</p>
                    <p className="text-lg font-semibold text-status-info">
                      {formatCurrency(yieldData.length > 0 ? yieldData[yieldData.length - 1].unutilized : 0)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-brand-purple to-brand-magenta rounded-lg text-white">
                  <div>
                    <p className="text-sm text-white/80">Total Monthly Yield</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(yieldData.length > 0 ? yieldData[yieldData.length - 1].total : 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/80">Annualized Return</p>
                    <p className="text-xl font-bold">
                      {stats.totalApprovedCredit > 0
                        ? ((stats.totalInterestRevenue * 12 / stats.totalApprovedCredit) * 100).toFixed(2)
                        : '0.00'}%
                    </p>
                  </div>
                </div>
              </div>
            </div> */}

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Pool Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">Active PSPs</span>
                  <span className="text-xl font-bold text-green-800">{stats.totalPSPs}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                  <span className="font-medium text-amber-800">Pending Applications</span>
                  <span className="text-xl font-bold text-amber-800">{stats.pendingApplications}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                  <span className="font-medium text-gray-800">Active Financings</span>
                  <span className="text-xl font-bold text-gray-800">{stats.totalFinancings}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <span className="font-medium text-purple-800">Total Credit Exposure</span>
                  <span className="text-xl font-bold text-purple-800">
                    {formatCurrency(stats.totalActiveCredit)}
                  </span>
                </div>
              </div>
            </div>
              <EarnedYieldChart yieldData={yieldData} />
          </div>

          {/* Yield Stats */}
          <div className="grid md:grid-cols-1 gap-6 mb-8">
            {/* Earned Yield Chart */}
          


          </div>
        </div>
      </main>
    </div>
  );
};

export default CFODashboard;
