import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, BarChart3, PieChart as PieChartIcon, TrendingUp, LogOut, Loader2, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cfoAPI } from '../../../services/api';

const YieldReports = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [yieldData, setYieldData] = useState([]);

  useEffect(() => {
    fetchYieldData();
  }, []);

  const fetchYieldData = async () => {
    try {
      setLoading(true);
      const response = await cfoAPI.getYieldHistory();
      setYieldData(response.data);
    } catch (err) {
      console.error('Failed to fetch yield data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals
  const totalUtilized = yieldData.reduce((sum, item) => sum + item.utilized, 0);
  const totalUnutilized = yieldData.reduce((sum, item) => sum + item.unutilized, 0);
  const totalYield = totalUtilized + totalUnutilized;
  const avgMonthlyYield = yieldData.length > 0 ? totalYield / yieldData.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-6 border-b border-white/10">
           <div className="flex items-center gap-2">
            <img src={"/logo-white.png"} alt="logo" className='h-20 ' />
          </div>
          <span className="text-xs text-white/60 mt-1 block">CFO Admin</span>
        </div>
        
        <nav className="p-4 space-y-2">
          <a href="/admin/cfo" className="sidebar-link">
            <BarChart3 className="w-5 h-5" />
            Treasury Overview
          </a>
          <a href="/admin/cfo/exposure" className="sidebar-link">
            <PieChartIcon className="w-5 h-5" />
            Exposure Analysis
          </a>
          <a href="/admin/cfo/yields" className="sidebar-link active">
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
            <h1 className="page-header">Yield Reports</h1>
            <p className="text-gray-600">Historical yield generation and revenue analytics</p>
          </header>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-brand-purple mx-auto mb-4" />
              <p className="text-gray-600">Loading yield data...</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="stats-card">
                  <span className="stats-label">Total Yield (YTD)</span>
                  <span className="stats-value text-gradient">{formatCurrency(totalYield)}</span>
                </div>
                <div className="stats-card">
                  <span className="stats-label">Utilized Yield</span>
                  <span className="stats-value text-status-success">{formatCurrency(totalUtilized)}</span>
                </div>
                <div className="stats-card">
                  <span className="stats-label">Unutilized Yield</span>
                  <span className="stats-value text-status-info">{formatCurrency(totalUnutilized)}</span>
                </div>
                <div className="stats-card">
                  <span className="stats-label">Avg Monthly Yield</span>
                  <span className="stats-value">{formatCurrency(avgMonthlyYield)}</span>
                </div>
              </div>

              {/* Yield Chart */}
              <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-6">Monthly Yield Trends (Last 12 Months)</h2>
                {yieldData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
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
                      <Area 
                        type="monotone" 
                        dataKey="utilized" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorUtilized)" 
                        name="Utilized Yield" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="unutilized" 
                        stroke="#6366f1" 
                        fillOpacity={1} 
                        fill="url(#colorUnutilized)" 
                        name="Unutilized Yield" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-12">No yield data available</p>
                )}
              </div>

              {/* Yield Breakdown Table */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-6">Monthly Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th className="text-right">Utilized Yield</th>
                        <th className="text-right">Unutilized Yield</th>
                        <th className="text-right">Total Yield</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yieldData.map((item, index) => (
                        <tr key={index}>
                          <td className="font-semibold">{item.month}</td>
                          <td className="text-right text-green-600 font-medium">{formatCurrency(item.utilized)}</td>
                          <td className="text-right text-blue-600 font-medium">{formatCurrency(item.unutilized)}</td>
                          <td className="text-right font-bold">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default YieldReports;
