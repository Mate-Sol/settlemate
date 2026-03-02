import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Clock, CheckCircle, DollarSign, TrendingUp, AlertCircle, Calendar, Building2, Hash, ExternalLink, Filter, Download, CreditCard, BarChart3, PieChart as PieChartIcon, LogOut } from 'lucide-react';
import { cfoAPI } from '../../../services/api';

const RepaymentMonitoring = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
    const [pendingRepayments, setPendingRepayments] = useState([]);
    const [completedRepayments, setCompletedRepayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPending: 0,
        totalPendingAmount: 0,
        totalCompleted: 0,
        totalCollected: 0
    });

    useEffect(() => {
        fetchRepaymentData();
    }, []);

    const fetchRepaymentData = async () => {
        try {
            setLoading(true);

            // Fetch all financings and repayment history
            const [financingsResponse, historyResponse] = await Promise.all([
                cfoAPI.getAllFinancings(),
                cfoAPI.getRepaymentHistory()
            ]);

            // Pending repayments = Disbursed financings
            const pending = financingsResponse.data.financings.filter(f => f.status === 'Disbursed');
            setPendingRepayments(pending);

            // Completed repayments from history
            setCompletedRepayments(historyResponse.data.repayments);

            // Calculate stats
            const totalPendingAmount = pending.reduce((sum, f) => sum + (f.amount || 0) + (f.accruedInterest?.total || 0), 0);
            const totalCollected = historyResponse.data.summary.totalInterestCollected + historyResponse.data.summary.totalPrincipal;

            setStats({
                totalPending: pending.length,
                totalPendingAmount,
                totalCompleted: historyResponse.data.summary.totalRepayments,
                totalCollected
            });
        } catch (error) {
            console.error('Failed to fetch repayment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDaysOverdue = (dueDate) => {
        if (!dueDate) return 0;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today - due;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading repayment data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
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
                    <a href="/admin/cfo/repayments" className="sidebar-link active">
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
            {/* Added w-full to ensure main takes available width */}
            <main className="ml-64 p-8 w-full">
                {/* Added mx-auto here to center this container */}
                <div className="w-full max-w-6xl mx-auto">

                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="page-header">Repayment Monitoring</h1>
                                <p className="text-gray-600">Track pending and completed repayments across all PSPs</p>
                            </div>
                            <button
                                onClick={fetchRepaymentData}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    </header>

                    {/* Summary Stats */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="stats-card">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-amber-600" />
                                <span className="stats-label">Pending Repayments</span>
                            </div>
                            <span className="stats-value text-status-warning">{stats.totalPending}</span>
                        </div>

                        <div className="stats-card">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-red-600" />
                                <span className="stats-label">Amount Outstanding</span>
                            </div>
                            <span className="stats-value text-red-600">{formatCurrency(stats.totalPendingAmount)}</span>
                        </div>

                        <div className="stats-card">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="stats-label">Completed Repayments</span>
                            </div>
                            <span className="stats-value text-status-success">{stats.totalCompleted}</span>
                        </div>

                        <div className="stats-card">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-5 h-5 text-brand-purple" />
                                <span className="stats-label">Total Collected</span>
                            </div>
                            <span className="stats-value text-gradient">{formatCurrency(stats.totalCollected)}</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="card">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${activeTab === 'pending'
                                    ? 'text-brand-purple border-b-2 border-brand-purple bg-gradient-to-r from-purple-50 to-transparent'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Pending Repayments ({stats.totalPending})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${activeTab === 'completed'
                                    ? 'text-brand-purple border-b-2 border-brand-purple bg-gradient-to-r from-purple-50 to-transparent'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Completed Repayments ({stats.totalCompleted})
                                </div>
                            </button>
                        </div>

                        {/* Pending Repayments Table */}
                        {activeTab === 'pending' && (
                            <div className="overflow-x-auto">
                                {pendingRepayments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No pending repayments</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PSP</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order Ref</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Principal</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Accrued Interest</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Due</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Disbursed</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days Elapsed</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {pendingRepayments.map((financing) => {
                                                const totalDue = (financing.amount || 0) + (financing.accruedInterest?.total || 0);
                                                const daysOverdue = calculateDaysOverdue(financing.dueDate);

                                                return (
                                                    <tr key={financing._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                                <span className="font-medium text-gray-900">{financing.pspId?.companyName || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono text-sm text-gray-600">{financing.orderReference}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                            {formatCurrency(financing.amount)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-green-600 font-medium">
                                                                {formatCurrency(financing.accruedInterest?.total || 0)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-lg font-bold text-gray-900">
                                                                {formatCurrency(totalDue)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {formatDate(financing.disbursedAt)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {financing.daysElapsed || 0} days
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {daysOverdue > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {daysOverdue} days overdue
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                    <Clock className="w-3 h-3" />
                                                                    Active
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* Completed Repayments Table */}
                        {activeTab === 'completed' && (
                            <div className="overflow-x-auto">
                                {completedRepayments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No completed repayments yet</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PSP</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order Ref</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Principal</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Interest Paid</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Repaid</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Variance</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Repaid On</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Transaction</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {completedRepayments.map((repayment) => (
                                                <tr key={repayment._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-4 h-4 text-gray-400" />
                                                            <span className="font-medium text-gray-900">{repayment.psp}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-sm text-gray-600">{repayment.orderReference}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                        {formatCurrency(repayment.principal)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-green-600 font-medium">
                                                            {formatCurrency(repayment.actualInterest)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-lg font-bold text-gray-900">
                                                            {formatCurrency(repayment.principal + repayment.actualInterest)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`font-medium ${repayment.variance >= 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {repayment.variance >= 0 ? '+' : ''}{formatCurrency(repayment.variance)}
                                                        </span>
                                                        <span className="text-xs text-gray-500 block">
                                                            ({repayment.variancePercentage >= 0 ? '+' : ''}{repayment.variancePercentage?.toFixed(1)}%)
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {formatDate(repayment.repaymentDate)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {repayment.txHash && (
                                                            <a
                                                                href={`https://sepolia.etherscan.io/tx/${repayment.txHash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 text-sm font-mono"
                                                            >
                                                                {repayment.txHash.substring(0, 8)}...
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RepaymentMonitoring;
