import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, Users, FileCheck, AlertTriangle, LogOut, ArrowLeft, CheckCircle, Clock, XCircle, Building, DollarSign, Calendar, FileText, Download, Loader2 } from 'lucide-react';
import { croAPI } from '../../../services/api';

const ApplicationReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  console.log(application);
  // Decision form data
  const [decisionData, setDecisionData] = useState({
    approvedAmount: '',
    approvedDuration: '',
    walletAddress: '',
    notes: ''
  });

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await croAPI.getApplication(id);
      setApplication(response.data);
      
      // Pre-fill approval form with requested amounts
      setDecisionData(prev => ({
        ...prev,
        approvedAmount: response.data.requestedAmount || '',
        approvedDuration: response.data.requestedDuration || ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDecision = (type) => {
    setDecision(type);
    setShowDecisionModal(true);
  };

  const submitDecision = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (decision === 'approve') {
        await croAPI.approveApplication(id, {
          approvedAmount: parseFloat(decisionData.approvedAmount),
          approvedDuration: parseInt(decisionData.approvedDuration),
          walletAddress: decisionData.walletAddress,
          notes: decisionData.notes
        });
        alert('Application approved! Smart contract deployment initiated.');
      } else if (decision === 'reject') {
        await croAPI.rejectApplication(id, {
          notes: decisionData.notes
        });
        alert('Application rejected.');
      } else if (decision === 'request-info') {
        await croAPI.requestInfo(id, {
          notes: decisionData.notes
        });
        alert('Additional information requested.');
      }

      // Navigate back to dashboard
      navigate('/admin/cro');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit decision');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading application</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/admin/cro')} className="btn-brand">
            Back to Dashboard
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
          <span className="text-xs text-white/60 mt-1 block">CRO Admin</span>
        </div>
        
        <nav className="p-4 space-y-2">
          <a href="/admin/cro" className="sidebar-link">
            <Users className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/admin/cro/applications" className="sidebar-link active">
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button 
              onClick={() => navigate('/admin/cro')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Applications
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="page-header mb-1">{application.companyName}</h1>
                <p className="text-gray-600">Credit Line Application Review</p>
              </div>
              <span className="badge badge-warning">{application.creditLineStatus}</span>
            </div>
          </div>

          {/* Application Summary */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="stats-card">
              <DollarSign className="w-5 h-5 text-brand-purple mb-2" />
              <span className="stats-label">Requested Amount</span>
              <span className="stats-value text-gradient">{formatCurrency(application.requestedAmount)}</span>
            </div>
            <div className="stats-card">
              <Calendar className="w-5 h-5 text-brand-purple mb-2" />
              <span className="stats-label">Duration</span>
              <span className="stats-value">{application.requestedDuration} Days</span>
            </div>
            <div className="stats-card">
              <Building className="w-5 h-5 text-brand-purple mb-2" />
              <span className="stats-label">Annual Revenue</span>
              <span className="stats-value">{formatCurrency(application.annualRevenue)}</span>
            </div>
          </div>

          {/* Company Information */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Registration Number</p>
                <p className="font-medium">{application.registrationNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Country</p>
                <p className="font-medium">{application.country}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year Established</p>
                <p className="font-medium">{application.yearEstablished}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Sector</p>
                <p className="font-medium">{application.sector}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transaction Volume</p>
                <p className="font-medium">{application.transactionVolume}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted Date</p>
                <p className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Key Contact Person</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{application.keyContact?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{application.keyContact?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{application.keyContact?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-4">KYC Documents</h2>
            <div className="space-y-3">
              {application?.kycDocuments?.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-brand-purple" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.size}</p>
                    </div>
                  </div>
                  <a 
                    href={doc.url}
                    className="flex items-center gap-2 text-brand-purple hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Actions */}
          <div className="flex gap-4">
            <button 
              onClick={() => handleDecision('approve')}
              className="btn-brand flex items-center gap-2 flex-1"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Application
            </button>
            <button 
              onClick={() => handleDecision('request-info')}
              className="btn-secondary flex items-center gap-2 flex-1"
            >
              <Clock className="w-5 h-5" />
              Request More Info
            </button>
            <button 
              onClick={() => handleDecision('reject')}
              className="px-6 py-3 rounded-lg font-semibold border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 flex-1"
            >
              <XCircle className="w-5 h-5" />
              Reject Application
            </button>
          </div>
        </div>
      </main>

      {/* Decision Modal */}
      {showDecisionModal && (
        <DecisionModal 
          decision={decision}
          application={application}
          decisionData={decisionData}
          setDecisionData={setDecisionData}
          submitting={submitting}
          error={error}
          onClose={() => {
            setShowDecisionModal(false);
            setError(null);
          }}
          onConfirm={submitDecision}
        />
      )}
    </div>
  );
};

// Decision Modal Component
const DecisionModal = ({ decision, application, decisionData, setDecisionData, submitting, error, onClose, onConfirm }) => {
  const modalConfig = {
    approve: {
      title: 'Approve Application',
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      bgColor: 'bg-green-100',
      message: 'You are about to approve this credit line application. Upon approval, a dedicated CreditLine Pool smart contract will be deployed on Sepolia testnet.',
      buttonText: 'Confirm Approval & Deploy Contract',
      buttonClass: 'bg-green-600 hover:bg-green-700',
    },
    'request-info': {
      title: 'Request Additional Information',
      icon: <Clock className="w-8 h-8 text-amber-600" />,
      bgColor: 'bg-amber-100',
      message: 'Request more information from the applicant. They will be notified via email.',
      buttonText: 'Send Request',
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
    },
    reject: {
      title: 'Reject Application',
      icon: <XCircle className="w-8 h-8 text-red-600" />,
      bgColor: 'bg-red-100',
      message: 'You are about to reject this credit line application. This action cannot be undone.',
      buttonText: 'Confirm Rejection',
      buttonClass: 'bg-red-600 hover:bg-red-700',
    },
  };

  const config = modalConfig[decision];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {config.icon}
          </div>
          
          <h2 className="text-xl font-bold text-center mb-2">{config.title}</h2>
          <p className="text-center text-gray-600 mb-2">{application.companyName}</p>
          <p className="text-center text-sm text-gray-500 mb-6">{config.message}</p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {decision === 'approve' && (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Approved Amount (USD) *</label>
                  <input
                    type="number"
                    value={decisionData.approvedAmount}
                    onChange={(e) => setDecisionData(prev => ({ ...prev, approvedAmount: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Duration (Days) *</label>
                  <input
                    type="number"
                    value={decisionData.approvedDuration}
                    onChange={(e) => setDecisionData(prev => ({ ...prev, approvedDuration: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="input-label">PSP Wallet Address (for contract deployment) *</label>
                <input
                  type="text"
                  value={decisionData.walletAddress}
                  onChange={(e) => setDecisionData(prev => ({ ...prev, walletAddress: e.target.value }))}
                  className="input-field font-mono text-sm"
                  placeholder="0x..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Contract will be deployed with this address as the borrower</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="input-label">Notes {decision !== 'approve' && '*'}</label>
            <textarea
              value={decisionData.notes}
              onChange={(e) => setDecisionData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-field min-h-[100px]"
              placeholder={decision === 'request-info' ? "Specify what information is needed..." : "Add internal notes..."}
              required={decision !== 'approve'}
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              disabled={submitting || (decision === 'approve' && (!decisionData.walletAddress || !decisionData.approvedAmount)) || (decision !== 'approve' && !decisionData.notes)}
              className={`${config.buttonClass} text-white px-6 py-3 rounded-lg font-semibold transition-all flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                config.buttonText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReview;
