import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, BarChart3, PieChart as PieChartIcon, TrendingUp, LogOut, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cfoAPI } from '../../../services/api';

const ExposureAnalysis = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exposureData, setExposureData] = useState([]);

  useEffect(() => {
    fetchExposureData();
  }, []);

  const fetchExposureData = async () => {
    try {
      setLoading(true);
      const response = await cfoAPI.getExposure();
      setExposureData(response.data);
    } catch (err) {
      console.error('Failed to fetch exposure data:', err);
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

  // Color palette for pie chart
  const COLORS = ['#4a1e60', '#9e2a5b', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  const pieChartData = exposureData.map((item, index) => ({
    name: item.psp,
    value: item.amount,
    color: COLORS[index % COLORS.length]
  }));

  const totalExposure = exposureData.reduce((sum, item) => sum + item.amount, 0);

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
          <a href="/admin/cfo/exposure" className="sidebar-link active">
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
            <h1 className="page-header">Exposure Analysis</h1>
            <p className="text-gray-600">PSP-level credit exposure breakdown</p>
          </header>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-brand-purple mx-auto mb-4" />
              <p className="text-gray-600">Loading exposure data...</p>
            </div>
          ) : (
            <>
              {/* Total Exposure Card */}
              <div className="card mb-8 p-6">
                <h2 className="text-lg font-semibold mb-2">Total System Exposure</h2>
                <p className="text-4xl font-bold text-gradient">{formatCurrency(totalExposure)}</p>
              </div>

              {/* Pie Chart and Table */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="card">
                  <h2 className="text-xl font-semibold mb-6">Exposure Distribution</h2>
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-12">No exposure data available</p>
                  )}
                </div>

                {/* Exposure Table */}
                <div className="card">
                  <h2 className="text-xl font-semibold mb-6">PSP Breakdown</h2>
                  <div className="space-y-4">
                    {exposureData.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <h3 className="font-semibold">{item.psp}</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Exposure</p>
                            <p className="font-semibold">{formatCurrency(item.amount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Financings</p>
                            <p className="font-semibold">{item.count}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Interest</p>
                            <p className="font-semibold text-green-600">{formatCurrency(item.interest)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExposureAnalysis;
