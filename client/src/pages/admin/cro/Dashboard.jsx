import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, Users, FileCheck, AlertTriangle, LogOut, Eye, Loader2 } from 'lucide-react';
import { croAPI } from '../../../services/api';
import moment from 'moment';

const CRODashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [appsResponse, statsResponse] = await Promise.all([
        croAPI.getApplications(''),
        croAPI.getStats()
      ]);

      setApplications(appsResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to fetch CRO dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src={"/logo-white.png"} alt="logo" className='h-20 w-auto' />
          </div>
          <span className="text-xs text-white/60 mt-1 block">CRO Admin</span>
        </div>

        <nav className="p-4 space-y-2">
          <a href="/admin/cro" className="sidebar-link active">
            <Users className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/admin/cro/applications" className="sidebar-link">
            <FileCheck className="w-5 h-5" />
            Applications
          </a>
          <a href="/admin/cro/overdue" className="sidebar-link">
            <AlertTriangle className="w-5 h-5" />
            Overdue
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
            <h1 className="page-header">CRO Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name} - Risk Management Overview</p>
          </header>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="stats-card">
              <span className="stats-label">Pending Applications</span>
              <span className="stats-value text-status-warning">{stats?.pendingApplications}</span>
            </div>
            <div className="stats-card">
              <span className="stats-label">Active Credit Lines</span>
              <span className="stats-value text-status-success">{stats?.activeLines}</span>
            </div>
            <div className="stats-card">
              <span className="stats-label">Rejected Applications</span>
              <span className="stats-value text-gradient">{stats?.rejectedApplications}</span>
            </div>

          </div>

          {/* Pending Applications Table */}
          <div className="table-container mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Pending Applications</h2>
            </div>
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell text-left">Company</th>
                  <th className="table-cell text-left">Amount</th>
                  <th className="table-cell text-left">Date</th>
                  <th className="table-cell text-left">Status</th>
                  <th className="table-cell text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="table-row">
                    <td className="table-cell font-medium">{app.companyName}</td>
                    <td className="table-cell">${app?.requestedAmount?.toLocaleString({
                      style: 'currency',
                      currency: 'USD'
                    })}</td>
                    <td className="table-cell">{moment(app.createdAt).format("ll")}</td>
                    <td className="table-cell">
                      <span className="badge badge-warning">{app.creditLineStatus}</span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => navigate(`/admin/cro/application/${app._id}`)}
                        className="flex items-center gap-2 px-4 py-2 text-brand-purple hover:bg-brand-purple hover:text-white rounded-lg transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CRODashboard;
